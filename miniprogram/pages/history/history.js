// pages/history/history.js  完整打卡历史
const { getGrade, getTreeInfo } = require('../../utils/carbonScore');

const TRANSPORT_ZH = { walk: '步行', bike: '骑行', bus: '公交/地铁', taxi: '打车', car: '自驾' };
const DIET_ZH = { vegan: '素食', normal: '普通饮食', high_carbon: '高碳饮食' };
const STATUS_ZH = { home: '居家', outside: '外出活动' };

Page({
  data: {
    loading: true,
    year: 0,
    month: 0,
    calDays: [],
    records: [],
    selDate: null,
    selRecord: null,
    showDetail: false,
    monthStats: { totalDays: 0, lowDays: 0, avgScore: '--', totalTrees: 0 },
  },

  onLoad() {
    this._initMonth();
  },
  onShow() {
    if (!this.data.loading) this._loadMonth(this.data.year, this.data.month);
  },
  onPullDownRefresh() {
    this._loadMonth(this.data.year, this.data.month);
    setTimeout(() => wx.stopPullDownRefresh(), 1200);
  },
  onShareAppMessage() {
    const s = this.data.monthStats;
    return {
      title: '碳迹：我' + this.data.year + '年' + this.data.month + '月低碳打卡' + s.totalDays + '天，快来一起！',
      path: '/pages/history/history',
    };
  },

  _initMonth() {
    const now = new Date();
    this._loadMonth(now.getFullYear(), now.getMonth() + 1);
  },

  _loadMonth(year, month) {
    this.setData({ loading: true, year, month });
    if (!getApp().globalData.cloudInited) {
      this._buildCalendar(year, month, []);
      return;
    }
    // 查询当月所有打卡记录
    const startDate = year + '-' + String(month).padStart(2, '0') + '-01';
    const endDate =
      year + '-' + String(month).padStart(2, '0') + '-' + String(new Date(year, month, 0).getDate()).padStart(2, '0');
    getApp()
      .cloudCall('getMonthHistory', { startDate, endDate }, { timeout: 15000 })
      .then((r) => {
        const records = (r.result && r.result.success && r.result.data.records) || [];
        this._buildCalendar(year, month, records);
      })
      .catch(() => {
        this._buildCalendar(year, month, []);
      });
  },

  _buildCalendar(year, month, records) {
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    // 当月天数
    const daysInMonth = new Date(year, month, 0).getDate();
    // 当月第一天是星期几
    const firstDay = new Date(year, month - 1, 1).getDay();
    // 构建日历格子
    const calDays = [];
    for (let i = 0; i < firstDay; i++) calDays.push(null); // 前置空格
    const recordMap = {};
    records.forEach((r) => {
      recordMap[r.date] = r;
    });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const rec = recordMap[ds];
      const isToday = isCurrentMonth && today.getDate() === d;
      const isFuture = new Date(ds) > today;
      calDays.push({
        day: d,
        date: ds,
        isToday,
        isFuture,
        hasRecord: !!rec,
        score: rec ? rec.score : null,
        grade: rec ? getGrade(rec.score) : null,
        treeType: rec ? getTreeInfo(rec.score).type : null,
        treeEmoji: rec
          ? getTreeInfo(rec.score).label === '小苗'
            ? '🌱'
            : getTreeInfo(rec.score).label === '小树'
              ? '🌿'
              : getTreeInfo(rec.score).label === '大树'
                ? '🌳'
                : '🌲'
          : null,
      });
    }
    // 后置空格补齐7的倍数
    while (calDays.length % 7 !== 0) calDays.push(null);

    // 月统计
    const scored = records;
    const lowDays = scored.filter((r) => r.score <= 3).length;
    const avg = scored.length ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(1) : '--';
    const monthStats = { totalDays: scored.length, lowDays, avgScore: avg, totalTrees: scored.length };

    this.setData({ calDays, records, monthStats, loading: false, selDate: null, selRecord: null, showDetail: false });
  },

  onDayTap(e) {
    const { date, hasRecord } = e.currentTarget.dataset;
    if (!hasRecord) return;
    const rec = this.data.records.find((r) => r.date === date);
    if (!rec) return;
    const tree = getTreeInfo(rec.score);
    const detail = {
      ...rec,
      treeEmoji: tree.label === '小苗' ? '🌱' : tree.label === '小树' ? '🌿' : tree.label === '大树' ? '🌳' : '🌲',
      treeLabel: tree.label,
      treeValue: tree.treeValue,
      gradeLabel: getGrade(rec.score).label,
      gradeColor: getGrade(rec.score).color,
      transportZH: TRANSPORT_ZH[rec.transport] || rec.transport,
      dietZH: DIET_ZH[rec.diet] || rec.diet,
      statusZH: STATUS_ZH[rec.status] || rec.status,
    };
    this.setData({ selDate: date, selRecord: detail, showDetail: true });
  },

  onCloseDetail() {
    this.setData({ showDetail: false });
  },

  onPrevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    this._loadMonth(year, month);
  },
  onNextMonth() {
    let { year, month } = this.data;
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return; // 不能超过当月
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    this._loadMonth(year, month);
  },
});
