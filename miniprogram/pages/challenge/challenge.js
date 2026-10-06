// pages/challenge/challenge.js  每日挑战系统
const { getToday, getChallengeKey, KEYS } = require('../../utils/storage');

// 挑战池：每天根据日期哈希选取，check 内联完成判定
const CHALLENGE_POOL = [
  {
    id: 'walk_all',
    icon: '🚶',
    title: '今日全程步行',
    desc: '出行选择步行，感受城市温度',
    target: '出行选择步行',
    bonus: 5,
    tip: '步行1公里约消耗80大卡，既低碳又健康！',
    check: (action) => action && action.transport === 'walk',
  },
  {
    id: 'vegan_day',
    icon: '🥗',
    title: '素食挑战日',
    desc: '今日饮食选择纯素食，为地球减负',
    target: '饮食选择素食',
    bonus: 5,
    tip: '素食一天相当于减少约3kg CO₂排放。',
    check: (action) => action && action.diet === 'vegan',
  },
  {
    id: 'bus_only',
    icon: '🚌',
    title: '公交出行日',
    desc: '今天只乘公共交通，不打车不自驾',
    target: '出行选择公交/地铁',
    bonus: 3,
    tip: '地铁比自驾每公里减少约85%的碳排放。',
    check: (action) => action && action.transport === 'bus',
  },
  {
    id: 'home_day',
    icon: '🏡',
    title: '宅家低碳日',
    desc: '今天以居家为主，减少不必要出行',
    target: '生活状态选择居家',
    bonus: 3,
    tip: '减少一次非必要出行，省时省力又减碳！',
    check: (action) => action && action.status === 'home',
  },
  {
    id: 'combo_eco',
    icon: '🌟',
    title: '终极低碳挑战',
    desc: '步行 + 素食 + 居家，三重低碳组合',
    target: '三项全选最低碳',
    bonus: 8,
    tip: '这个组合的碳评分将低至0分，种出🌲巨树！',
    check: (action) => action && action.transport === 'walk' && action.diet === 'vegan' && action.status === 'home',
  },
  {
    id: 'bike_go',
    icon: '🚲',
    title: '骑行通勤日',
    desc: '选择骑行或步行代替机动车出行',
    target: '出行选择步行（代替骑行）',
    bonus: 4,
    tip: '骑行是城市中最高效的低碳出行方式之一。',
    check: (action) => action && action.transport === 'walk',
  },
  {
    id: 'no_meat',
    icon: '🥦',
    title: '无肉星期一',
    desc: '今天不吃肉，选择素食或普通饮食',
    target: '饮食避免高碳食品',
    bonus: 4,
    tip: '减少红肉摄入是个人减碳最有效的饮食行为。',
    check: (action) => action && action.diet !== 'high_carbon',
  },
];

function getDailyChallenge() {
  const today = getToday();
  // 根据日期生成稳定的挑战索引
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) % CHALLENGE_POOL.length;
  return CHALLENGE_POOL[hash];
}

Page({
  data: {
    today: '',
    challenge: null,
    todayAction: null,
    completed: false,
    bonusClaimed: false,
    allChallenges: CHALLENGE_POOL,
    showHistory: false,
    historyDays: [],
  },

  onLoad() {
    this._init();
  },
  onShow() {
    this._init();
  },

  onShareAppMessage() {
    const c = this.data.challenge;
    return {
      title: c ? '碳迹每日挑战：' + c.title + '，快来参与！' : '碳迹每日挑战',
      path: '/pages/challenge/challenge',
    };
  },

  _init() {
    const today = getToday();
    const challenge = getDailyChallenge();
    let todayAction = null;
    let bonusClaimed = false;
    try {
      todayAction = wx.getStorageSync(KEYS.TODAY);
      if (todayAction && todayAction.date !== today) todayAction = null;
      bonusClaimed = wx.getStorageSync(getChallengeKey(today)) || false;
    } catch (e) {}

    const completed = challenge.check(todayAction);

    // 历史挑战（近7天）
    const historyDays = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds =
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      let hash = 0;
      for (let j = 0; j < ds.length; j++) hash = (hash * 31 + ds.charCodeAt(j)) % CHALLENGE_POOL.length;
      let claimed = false;
      try {
        claimed = wx.getStorageSync(getChallengeKey(ds)) || false;
      } catch (e) {}
      historyDays.push({ date: ds, dateLabel: ds.slice(5), challenge: CHALLENGE_POOL[hash], claimed });
    }

    this.setData({ today, challenge, todayAction, completed, bonusClaimed, historyDays });

    // 自动领取奖励
    if (completed && !bonusClaimed) {
      this._claimBonus(challenge);
    }
  },

  _claimBonus(challenge) {
    const today = getToday();
    if (getApp().globalData.cloudInited && getApp().globalData.openid) {
      getApp()
        .cloudCall(
          'saveAction',
          { challengeBonus: challenge.bonus, challengeId: challenge.id, date: today },
          { timeout: 10000 }
        )
        .then((r) => {
          const data = r.result.data || {};
          try {
            wx.setStorageSync(getChallengeKey(today), true);
          } catch (e) {}
          this.setData({ bonusClaimed: true });
          getApp().updateUserInfo({
            totalPoints: data.newTotalPoints,
            level: data.newLevel,
            weekPoints: data.weekPoints,
            weekPointsStart: data.weekPointsStart,
          });
          wx.showToast({ title: '+' + data.challengeBonus + ' 奖励积分 🎉', icon: 'none', duration: 2500 });
          wx.vibrateShort({ type: 'heavy' });
        })
        .catch((err) => {
          wx.showToast({ title: (err && err.message) || '挑战奖励领取失败', icon: 'none' });
        });
      return;
    }

    try {
      wx.setStorageSync(getChallengeKey(today), true);
    } catch (e) {}
    this.setData({ bonusClaimed: true });
    wx.showToast({ title: '+' + challenge.bonus + ' 本地奖励积分 🎉', icon: 'none', duration: 2500 });
    wx.vibrateShort({ type: 'heavy' });
  },

  onGoRecord() {
    wx.switchTab({ url: '/pages/record/record' });
  },

  onToggleHistory() {
    this.setData({ showHistory: !this.data.showHistory });
  },
});
