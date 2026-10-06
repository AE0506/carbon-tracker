const { getLevelProgress } = require('../../utils/carbonScore');
const { clearAll, KEYS } = require('../../utils/storage');
Page({
  data: {
    userInfo: null,
    levelProgress: null,
    stats: { totalDays: 0, totalPoints: 0, totalTrees: 0, streak: 0, lowPct: 0 },
  },
  onLoad() {
    getApp().onLoginReady((u) => this._render(u));
  },
  onShow() {
    const u = getApp().globalData.userInfo;
    if (u) this._render(u);
  },
  _render(u) {
    if (!u) return;
    const prog = getLevelProgress(u.totalPoints || 0);
    const pct = u.totalDays > 0 ? Math.round(((u.lowCarbonCount || 0) / u.totalDays) * 100) : 0;
    this.setData({
      userInfo: u,
      levelProgress: prog,
      stats: {
        totalDays: u.totalDays || 0,
        totalPoints: u.totalPoints || 0,
        totalTrees: u.totalTrees || 0,
        streak: u.streak || 0,
        lowPct: pct,
      },
    });
  },
  onChooseAvatar(e) {
    const url = e.detail.avatarUrl;
    this.setData({ 'userInfo.avatarUrl': url });
    const cp = 'avatars/' + getApp().globalData.openid + '.jpg';
    if (!getApp().globalData.cloudInited) {
      wx.showToast({ title: '云端未连接，暂不可用', icon: 'none' });
      return;
    }
    wx.cloud
      .uploadFile({ cloudPath: cp, filePath: url })
      .then((r) => getApp().cloudCall('updateProfile', { avatarUrl: r.fileID }, { timeout: 15000 }))
      .then(() => {
        if (getApp().globalData.userInfo) getApp().globalData.userInfo.avatarUrl = url;
        wx.showToast({ title: '头像更新成功', icon: 'success' });
      })
      .catch(() => wx.showToast({ title: '上传失败，请检查网络', icon: 'none' }));
  },
  onNickConfirm(e) {
    const nick = e.detail.value;
    if (!nick) return;
    this.setData({ 'userInfo.nickname': nick });
    getApp()
      .cloudCall('updateProfile', { nickname: nick }, { timeout: 10000 })
      .then(() => {
        if (getApp().globalData.userInfo) getApp().globalData.userInfo.nickname = nick;
        try {
          const c = wx.getStorageSync(KEYS.LOGIN);
          if (c) {
            c.userInfo.nickname = nick;
            wx.setStorageSync(KEYS.LOGIN, c);
          }
        } catch (e) {}
        wx.showToast({ title: '昵称已更新', icon: 'success' });
      })
      .catch((err) => {
        wx.showToast({ title: (err && err.message) || '昵称更新失败', icon: 'none' });
      });
  },
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后本地记录保留，云端数据不受影响',
      success: (r) => {
        if (r.confirm) {
          getApp().clearLoginCache();
          wx.redirectTo({ url: '/pages/onboarding/onboarding' });
        }
      },
    });
  },
  onClearCache() {
    wx.showModal({
      title: '清除本地缓存',
      content: '仅清除本地临时数据，云端数据不受影响',
      success: (r) => {
        if (r.confirm) {
          clearAll();
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      },
    });
  },
  onShareAppMessage() {
    const u = this.data.userInfo;
    return {
      title: u ? u.nickname + '的碳迹低碳足迹 · 累计' + u.totalDays + '天打卡！' : '碳迹 · 记录低碳行为',
      path: '/pages/index/index',
    };
  },
  goAchieve() {
    wx.navigateTo({ url: '/pages/achievement/achievement' });
  },
  goTips() {
    wx.navigateTo({ url: '/pages/tips/tips' });
  },
  goChallenge() {
    wx.navigateTo({ url: '/pages/challenge/challenge' });
  },
  goLeaderboard() {
    wx.navigateTo({ url: '/pages/leaderboard/leaderboard' });
  },
  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },
  goForest() {
    wx.navigateTo({ url: '/pages/forest/forest' });
  },
  goStats() {
    wx.switchTab({ url: '/pages/stats/stats' });
  },
  goLearn() {
    wx.navigateTo({ url: '/pages/learn/learn' });
  },
  onReminder() {
    // 订阅消息模板ID — 需在微信公众平台 → 订阅消息 → 选择「公共模板」获取
    // 推荐模板：打卡提醒 / 活动通知
    const REMIND_TMPL_ID = 'your-reminder-template-id';
    if (!REMIND_TMPL_ID || REMIND_TMPL_ID === 'your-reminder-template-id') {
      wx.showModal({
        title: '提醒功能未配置',
        content: '请在微信公众平台申请订阅消息模板后，在代码中配置模板ID。\n\n路径：个人中心 → profile.js → onReminder',
        showCancel: false,
      });
      return;
    }
    wx.requestSubscribeMessage({
      tmplIds: [REMIND_TMPL_ID],
      success: (res) => {
        if (res[REMIND_TMPL_ID] === 'accept') {
          wx.setStorageSync(KEYS.REMINDER, true);
          wx.showToast({ title: '已开启提醒', icon: 'success' });
        } else {
          wx.showToast({ title: '已拒绝授权，可在设置中修改', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '暂不支持，可在设置中手动授权', icon: 'none' });
      },
    });
  },
});
