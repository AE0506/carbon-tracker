// pages/record/record.js  打卡记录 — v6.7 服务端返回值透传
const {
  calculateScore,
  getGrade,
  generateFeedback,
  calcPointsEarned,
  getTreeInfo,
} = require('../../utils/carbonScore');
const { saveTodayAction, getTodayAction, getToday, KEYS, clearWeekCache } = require('../../utils/storage');
const { buildLocalUserPatch, buildLocalDeletePatch } = require('../../utils/localStats');
const syncQueue = require('../../utils/syncQueue');
const { transportOpts, dietOpts, statusOpts } = require('../../data/record-options');
const BADGE_MAP = {
  first_record: '初次打卡',
  streak_3: '低碳先锋',
  streak_7: '绿色坚持者',
  low_5: '低碳达人',
  walk_10: '步行健将',
  vegan_5: '素食之星',
  total_30: '铁杆记录者',
  giant_tree: '巨树种植者',
  level_5: '低碳大师',
};
const BADGE_ICON = {
  first_record: '🌱',
  streak_3: '🔥',
  streak_7: '💪',
  low_5: '🏅',
  walk_10: '🚶',
  vegan_5: '🥗',
  total_30: '📅',
  giant_tree: '🌲',
  level_5: '⭐',
};
Page({
  data: {
    transportOpts,
    dietOpts,
    statusOpts,
    sel: { transport: null, diet: null, status: null },
    allSelected: false,
    previewScore: null,
    previewGrade: null,
    previewTree: null,
    submitting: false,
    alreadyRecorded: false,
    showResult: false,
    result: null,
    showAchieve: false,
    newBadges: [],
    showTreeAnim: false,
    showError: false,
    errorMsg: '',
  },
  onLoad() {
    this._chk();
  },
  onShow() {
    this._chk();
  },
  _chk() {
    const t = getTodayAction();
    if (t) {
      this.setData({ alreadyRecorded: true, sel: { transport: t.transport, diet: t.diet, status: t.status } });
      this._calcPrev();
    } else {
      this.setData({ alreadyRecorded: false });
    }
  },
  onSelectOpt(e) {
    const { cat, key } = e.currentTarget.dataset;
    this.setData({ sel: { ...this.data.sel, [cat]: key } });
    this._calcPrev();
  },
  _calcPrev() {
    const { transport, diet, status } = this.data.sel;
    const ok = !!(transport && diet && status);
    if (ok) {
      const sc = calculateScore({ transport, diet, status });
      this.setData({ allSelected: true, previewScore: sc, previewGrade: getGrade(sc), previewTree: getTreeInfo(sc) });
    } else {
      this.setData({ allSelected: false, previewScore: null, previewGrade: null, previewTree: null });
    }
  },
  _showError(msg) {
    this.setData({ showError: true, errorMsg: msg });
    setTimeout(() => this.setData({ showError: false, errorMsg: '' }), 3000);
  },
  _validateSubmit() {
    if (!this.data.allSelected) {
      this._showError('请先完成三项选择');
      return false;
    }
    if (this.data.submitting) {
      this._showError('正在提交中，请稍候');
      return false;
    }
    return true;
  },
  onSubmit() {
    if (!this._validateSubmit()) return;
    this.setData({ submitting: true });
    const { transport, diet, status } = this.data.sel;
    const score = calculateScore({ transport, diet, status }),
      grade = getGrade(score),
      fb = generateFeedback(score),
      pts = calcPointsEarned(score),
      tree = getTreeInfo(score),
      date = getToday();
    const previousTodayAction = getTodayAction();
    const nextAction = { transport, diet, status, score, date, pts, treeType: tree.type, treeValue: tree.treeValue };
    saveTodayAction(nextAction);
    clearWeekCache();
    wx.vibrateShort({ type: 'medium' });
    setTimeout(() => this.setData({ showTreeAnim: true }), 100);
    setTimeout(
      () =>
        this.setData({
          showTreeAnim: false,
          showResult: true,
          alreadyRecorded: true,
          result: { score, grade, fb, pts, treeInfo: tree },
        }),
      1250
    );

    if (getApp().globalData.cloudInited) {
      getApp()
        .cloudCall('saveAction', { transport, diet, status, date }, { timeout: 15000 })
        .then((r) => {
          if (r.result && r.result.success) {
            const d = r.result.data;
            getApp().updateUserInfo({
              totalPoints: d.newTotalPoints,
              totalTrees: d.totalTrees,
              streak: d.streak,
              level: d.newLevel,
              lowCarbonCount: d.lowCarbonCount,
              walkCount: d.walkCount,
              veganCount: d.veganCount,
              giantTreeCount: d.giantTreeCount,
              seedlingTreeCount: d.seedlingTreeCount,
              smallTreeCount: d.smallTreeCount,
              mediumTreeCount: d.mediumTreeCount,
              weekPoints: d.weekPoints,
              weekPointsStart: d.weekPointsStart,
              totalDays: d.totalDays,
            });
          }
          const nb = (r.result && r.result.data && r.result.data.newBadges) || [];
          if (nb.length) {
            setTimeout(() => {
              this.setData({
                showAchieve: true,
                newBadges: nb.map((id) => ({ id, name: BADGE_MAP[id] || id, icon: BADGE_ICON[id] || '🏅' })),
              });
              wx.vibrateShort({ type: 'heavy' });
            }, 2500);
          }
          this.setData({ submitting: false });
        })
        .catch((err) => {
          console.warn('[saveAction] 云端同步失败，数据已本地保存', err);
          syncQueue.enqueue({ transport, diet, status, date });
          getApp().globalData.cloudOutOfSync = true;
          getApp().updateUserInfo(buildLocalUserPatch(getApp().globalData.userInfo, nextAction, previousTodayAction));
          this.setData({ submitting: false });
        });
    } else {
      // 纯本地模式也更新全局状态
      getApp().globalData.cloudOutOfSync = true;
      getApp().updateUserInfo(buildLocalUserPatch(getApp().globalData.userInfo, nextAction, previousTodayAction));
      this.setData({ submitting: false });
    }
  },
  onCloseResult() {
    this.setData({ showResult: false, showTreeAnim: false });
    wx.switchTab({ url: '/pages/index/index' });
  },
  onCloseAchieve() {
    this.setData({ showAchieve: false, newBadges: [] });
  },
  onCloseError() {
    this.setData({ showError: false, errorMsg: '' });
  },
  onMaskTap() {},
  onDelete() {
    wx.showModal({
      title: '删除今日记录',
      content: '删除后今日打卡数据将被移除，树木也会消失。确定删除？',
      confirmText: '删除',
      confirmColor: '#e05c3a',
      cancelText: '保留',
      success: (r) => {
        if (!r.confirm) return;
        this.setData({ submitting: true });
        const previousTodayAction = getTodayAction();
        const date = require('../../utils/storage').getToday();
        if (getApp().globalData.cloudInited) {
          getApp()
            .cloudCall('deleteAction', { date }, { timeout: 10000 })
            .then((res) => {
              wx.removeStorageSync(KEYS.TODAY);
              clearWeekCache();
              if (res.result && res.result.data) getApp().updateUserInfo(res.result.data);
              this.setData({
                alreadyRecorded: false,
                showResult: false,
                showTreeAnim: false,
                sel: { transport: null, diet: null, status: null },
                allSelected: false,
                previewScore: null,
                previewGrade: null,
                previewTree: null,
                submitting: false,
              });
              wx.showToast({ title: '已删除', icon: 'success' });
            })
            .catch((err) => {
              this.setData({ submitting: false });
              wx.showToast({ title: '删除失败：' + ((err && err.message) || '网络异常'), icon: 'none' });
            });
        } else {
          wx.removeStorageSync(KEYS.TODAY);
          clearWeekCache();
          getApp().updateUserInfo(buildLocalDeletePatch(getApp().globalData.userInfo, previousTodayAction));
          this.setData({
            alreadyRecorded: false,
            showResult: false,
            showTreeAnim: false,
            sel: { transport: null, diet: null, status: null },
            allSelected: false,
            previewScore: null,
            previewGrade: null,
            previewTree: null,
            submitting: false,
          });
          wx.showToast({ title: '已删除（本地）', icon: 'success' });
        }
      },
    });
  },
  onShareAppMessage() {
    return { title: '碳迹 · 记录低碳行为，一起守护地球！', path: '/pages/record/record' };
  },
});
