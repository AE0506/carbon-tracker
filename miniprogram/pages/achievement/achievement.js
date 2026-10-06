// pages/achievement/achievement.js  v6.7 — 树类型统计
const { getLevelProgress } = require('../../utils/carbonScore');
const { getBadgeList } = require('../../utils/achievement');
Page({
  data: {
    levelProgress: null,
    badges: [],
    streak: 0,
    loading: true,
    treeStats: { seedling: 0, small: 0, medium: 0, giant: 0 },
  },
  onLoad() {
    this._load();
  },
  onShow() {
    this._load();
  },
  onShareAppMessage() {
    const lv = this.data.levelProgress;
    return {
      title: lv ? '我在碳迹达到了' + lv.lvInfo.name + '，快来一起挑战！' : '碳迹 · 成就中心',
      path: '/pages/achievement/achievement',
    };
  },
  _load() {
    const app = getApp();
    if (!app.globalData.cloudInited) {
      this._render(app.globalData.userInfo || {}, []);
      return;
    }
    app
      .cloudCall('login', {}, { timeout: 10000 })
      .then((r) => {
        const s = (r.result && r.result.data && r.result.data.userInfo) || {};
        this._render(s, s.unlockedBadges || []);
      })
      .catch(() => {
        this._render(app.globalData.userInfo || {}, []);
      });
  },
  _render(userInfo, unlockedBadges) {
    this.setData({
      levelProgress: getLevelProgress(userInfo.totalPoints || 0),
      badges: getBadgeList(unlockedBadges),
      streak: userInfo.streak || 0,
      loading: false,
      treeStats: {
        seedling: userInfo.seedlingTreeCount || 0,
        small: userInfo.smallTreeCount || 0,
        medium: userInfo.mediumTreeCount || 0,
        giant: userInfo.giantTreeCount || 0,
      },
    });
  },
});
