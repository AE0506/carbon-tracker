const { getGrade, getLevelProgress, getTreeInfo } = require('../../utils/carbonScore');
const { getTodayAction, saveWeekCache, getWeekCache, isOnboardingDone } = require('../../utils/storage');
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
Page({
  data: {
    userInfo: null,
    levelProgress: null,
    todayScored: false,
    todayScore: null,
    todayGrade: null,
    todayTree: null,
    weekData: [],
    weekStats: { lowDays: 0, avgScore: '--', streak: 0 },
    loading: true,
    refreshing: false,
    cloudOutOfSync: false,
  },
  onLoad() {
    if (!isOnboardingDone()) {
      wx.redirectTo({ url: '/pages/onboarding/onboarding' });
      return;
    }
    getApp().onLoginReady((u) => {
      this.setData({ userInfo: u });
      this._load();
    });
  },
  onShow() {
    if (this.data.userInfo) {
      this._refreshToday();
      this._fetchWeek();
    }
    this.setData({ cloudOutOfSync: getApp().globalData.cloudOutOfSync });
  },
  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this._load();
    setTimeout(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    }, 1500);
  },
  onUserDataRefresh(u) {
    this.setData({ userInfo: u, cloudOutOfSync: getApp().globalData.cloudOutOfSync });
    if (u) this._updateLv(u);
  },
  _load() {
    this._refreshToday();
    this._fetchWeek();
    if (this.data.userInfo) this._updateLv(this.data.userInfo);
  },
  _refreshToday() {
    const a = getTodayAction();
    if (a) {
      this.setData({
        todayScored: true,
        todayScore: a.score,
        todayGrade: getGrade(a.score),
        todayTree: getTreeInfo(a.score),
      });
    } else {
      this.setData({ todayScored: false, todayScore: null, todayGrade: null, todayTree: null });
    }
  },
  _fetchWeek() {
    const cached = getWeekCache();
    if (cached) {
      this._procWeek(cached);
    }
    if (!getApp().globalData.cloudInited) {
      this.setData({ loading: false });
      return;
    }
    getApp()
      .cloudCall('getWeekStats', {}, { timeout: 12000 })
      .then((r) => {
        if (r.result && r.result.success) {
          saveWeekCache(r.result.data.weekData);
          this._procWeek(r.result.data.weekData);
        }
      })
      .catch((err) => {
        console.warn('[index] getWeekStats 失败，使用本地数据', err);
        this.setData({ loading: false });
      });
  },
  _procWeek(raw) {
    const ti = (new Date().getDay() + 6) % 7;
    const local = getTodayAction();
    if (local && raw[ti]) raw[ti] = { ...raw[ti], scored: true, score: local.score };
    const scored = raw.filter((d) => d && d.scored);
    const low = scored.filter((d) => d.score <= 3).length;
    const avg = scored.length ? (scored.reduce((s, d) => s + d.score, 0) / scored.length).toFixed(1) : '--';
    let streak = 0;
    for (let i = ti; i >= 0; i--) {
      if (raw[i] && raw[i].scored) streak++;
      else break;
    }
    const weekData = raw.map((d, i) => ({
      label: i === ti ? '今' : DAYS[i].slice(1),
      isToday: i === ti,
      scored: !!(d && d.scored),
      score: d && d.scored ? d.score : null,
      grade: d && d.scored ? getGrade(d.score) : null,
      tree: d && d.scored ? getTreeInfo(d.score) : null,
    }));
    this.setData({ weekData, weekStats: { lowDays: low, avgScore: avg, streak }, loading: false });
  },
  _updateLv(u) {
    this.setData({ levelProgress: getLevelProgress(u.totalPoints || 0) });
  },
  onShareAppMessage() {
    return { title: '碳迹 · 记录每一步，守护每一棵树', path: '/pages/index/index' };
  },
  goRecord() {
    wx.switchTab({ url: '/pages/record/record' });
  },
  goChallenge() {
    wx.navigateTo({ url: '/pages/challenge/challenge' });
  },
  goLeaderboard() {
    wx.navigateTo({ url: '/pages/leaderboard/leaderboard' });
  },
  goForest() {
    wx.navigateTo({ url: '/pages/forest/forest' });
  },
  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },
  goLearn() {
    wx.navigateTo({ url: '/pages/learn/learn' });
  },
  goGuide() {
    wx.switchTab({ url: '/pages/guide/guide' });
  },
});
