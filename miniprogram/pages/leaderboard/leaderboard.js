// pages/leaderboard/leaderboard.js  社区排行榜
Page({
  data: {
    tab: 'week',
    loading: true,
    isDemo: false,
    weekList: [],
    totalList: [],
    myRank: null,
    myInfo: null,
  },
  onLoad() {
    this._load();
  },
  onShow() {
    this._load();
  },
  onShareAppMessage() {
    const rank = this.data.myRank;
    return {
      title: rank ? '我在碳迹排行榜排第' + rank + '名，快来挑战我！' : '碳迹 · 低碳排行榜，看看谁最环保！',
      path: '/pages/leaderboard/leaderboard',
    };
  },
  onTabTap(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },
  _load() {
    this.setData({ loading: true });
    const userInfo = getApp().globalData.userInfo || {};
    this.setData({ myInfo: userInfo });

    if (!getApp().globalData.cloudInited) {
      this._mockData(userInfo);
      this.setData({ isDemo: true });
      return;
    }
    // 真实模式：查询云数据库前50名
    getApp()
      .cloudCall('getLeaderboard', {}, { timeout: 12000 })
      .then((r) => {
        if (r.result && r.result.success) {
          this.setData({
            weekList: r.result.data.weekList || [],
            totalList: r.result.data.totalList || [],
            myRank: r.result.data.myRank,
            loading: false,
          });
        } else {
          this._mockData(userInfo);
          this.setData({ isDemo: true });
        }
      })
      .catch(() => {
        this._mockData(userInfo);
        this.setData({ isDemo: true });
      });
  },
  _mockData(userInfo) {
    const MOCK_NAMES = [
      '绿色先锋',
      '步行达人',
      '素食之星',
      '低碳卫士',
      '环保英雄',
      '地球守护',
      '绿芽新人',
      '清风行者',
      '碳迹达人',
      '自然使者',
    ];
    const MOCK_TREES = ['🌳', '🌲', '🌿', '🌱'];
    const myPts = userInfo.totalPoints || 0;
    const myDays = userInfo.totalDays || 0;
    // 生成10条假数据
    const list = MOCK_NAMES.map((name, i) => {
      const pts = Math.max(10, 350 - i * 28 + Math.floor(Math.random() * 20));
      const days = Math.max(1, 20 - i * 2 + Math.floor(Math.random() * 3));
      return { rank: i + 1, name, pts, days, avatar: MOCK_TREES[i % 4], isMe: false };
    });
    // 插入自己
    let myRank = list.findIndex((l) => l.pts < myPts);
    if (myRank < 0) myRank = list.length;
    list.splice(myRank, 0, {
      rank: myRank + 1,
      name: userInfo.nickname || '我',
      pts: myPts,
      days: myDays,
      avatar: '🌿',
      isMe: true,
    });
    list.forEach((l, i) => (l.rank = i + 1));
    const weekList = list.slice(0, 10);
    const totalList = [...list]
      .sort((a, b) => b.days - a.days)
      .slice(0, 10)
      .map((l, i) => ({ ...l, rank: i + 1 }));
    this.setData({ weekList, totalList, myRank: myRank + 1, loading: false });
  },
});
