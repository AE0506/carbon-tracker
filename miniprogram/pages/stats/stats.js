const { getGrade } = require('../../utils/carbonScore');
const { getWeekCache, saveWeekCache, getTodayAction } = require('../../utils/storage');
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
Page({
  data: {
    loading: true,
    weekData: [],
    summary: { avgScore: '--', lowDays: 0, bestScore: '--', totalDays: 0 },
    behaviorStats: [],
    weekInsight: '',
    error: null,
  },
  onLoad() {
    this._isVisible = false;
    this._loginReady = false;
    getApp().onLoginReady(() => {
      this._loginReady = true;
      if (this._isVisible) this._load();
    });
  },
  onShow() {
    this._isVisible = true;
    if (this._loginReady) this._load();
  },
  onHide() {
    this._isVisible = false;
  },
  onPullDownRefresh() {
    this._load();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1500);
  },
  onRetry() {
    this._load();
  },
  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },
  onShareAppMessage() {
    return { title: '碳迹 · 我的低碳数据统计', path: '/pages/stats/stats' };
  },
  _load() {
    this.setData({ loading: true, error: null });
    const c = getWeekCache();
    if (c) this._proc(c);
    if (getApp().globalData.cloudInited) {
      getApp()
        .cloudCall('getWeekStats', {}, { timeout: 12000, showLoading: false })
        .then((r) => {
          if (r.result && r.result.success) {
            saveWeekCache(r.result.data.weekData);
            this._proc(r.result.data.weekData);
          } else {
            this.setData({ loading: false, error: '数据加载失败' });
          }
        })
        .catch((err) => {
          console.warn('[stats] 云函数失败', err);
          this.setData({ loading: false, error: '网络异常，请下拉刷新重试' });
        });
    } else {
      this.setData({ loading: false });
    }
  },
  _proc(raw) {
    if (!Array.isArray(raw)) {
      this.setData({ loading: false, error: '统计数据格式异常，请下拉刷新重试' });
      return;
    }
    const ti = (new Date().getDay() + 6) % 7;
    const local = getTodayAction();
    if (local && raw[ti]) raw[ti] = { ...raw[ti], scored: true, score: local.score };
    const scored = raw.filter((d) => d && d.scored);
    const avg = scored.length ? (scored.reduce((s, d) => s + d.score, 0) / scored.length).toFixed(1) : '--';
    const low = scored.filter((d) => d.score <= 3).length;
    const best = scored.length ? Math.min(...scored.map((d) => d.score)) : '--';
    const weekData = raw.map((d, i) => {
      const g = d && d.scored ? getGrade(d.score) : null;
      return {
        label: i === ti ? '今' : DAYS[i].slice(1),
        fullLabel: i === ti ? '今天' : DAYS[i],
        isToday: i === ti,
        scored: !!(d && d.scored),
        score: d && d.scored ? d.score : null,
        grade: g,
        barH: d && d.scored ? Math.max(6, Math.round((d.score / 10) * 88)) : 0,
        barColor: g ? g.color : '#eee',
      };
    });
    const tc = { walk: 0, bus: 0, taxi: 0, car: 0 },
      dc = { vegan: 0, normal: 0, high_carbon: 0 };
    scored.forEach((d) => {
      if (tc[d.transport] !== undefined) tc[d.transport]++;
      if (dc[d.diet] !== undefined) dc[d.diet]++;
    });
    const tot = Math.max(scored.length, 1);
    const behaviorStats = [
      {
        icon: '🚶',
        name: '步行出行',
        count: tc.walk,
        pct: Math.round((tc.walk / tot) * 100),
        color: '#2d9e65',
        bg: '#e8f5ee',
      },
      {
        icon: '🚌',
        name: '公交出行',
        count: tc.bus,
        pct: Math.round((tc.bus / tot) * 100),
        color: '#4a7fd4',
        bg: '#e8f0ff',
      },
      {
        icon: '🥗',
        name: '素食饮食',
        count: dc.vegan,
        pct: Math.round((dc.vegan / tot) * 100),
        color: '#2d9e65',
        bg: '#f0faf5',
      },
      {
        icon: '🍱',
        name: '普通饮食',
        count: dc.normal,
        pct: Math.round((dc.normal / tot) * 100),
        color: '#f0a500',
        bg: '#fff8e8',
      },
      {
        icon: '🥩',
        name: '高碳饮食',
        count: dc.high_carbon,
        pct: Math.round((dc.high_carbon / tot) * 100),
        color: '#e05c3a',
        bg: '#fef0eb',
      },
    ].filter((b) => b.count > 0);
    const insight =
      scored.length === 0
        ? '本周还没有记录，快去打卡吧！🌱'
        : low >= 5
          ? '本周' + low + '天低碳，表现出色！🎉'
          : low >= 3
            ? '本周有' + low + '天低碳，加把劲！💪'
            : '低碳天数还可以提升，试试步行和素食 🌿';
    this.setData({
      weekData,
      summary: { avgScore: avg, lowDays: low, bestScore: best, totalDays: scored.length },
      behaviorStats,
      weekInsight: insight,
      loading: false,
    });
  },
});
