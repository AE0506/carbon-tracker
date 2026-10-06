// pages/guide/guide.js  低碳行动指南  v6.7 — const/let + 箭头函数
const { guideData } = require('../../data/guide-data');

Page({
  data: {
    categories: [
      { id: 'daily', name: '日常出行' },
      { id: 'home', name: '居家生活' },
      { id: 'diet', name: '饮食消费' },
      { id: 'work', name: '工作办公' },
      { id: 'recycle', name: '垃圾分类' },
    ],
    selectedCategory: 'daily',
    userCarbonLevel: 'medium',
    currentGuide: [],
  },

  onLoad() {
    this.getUserCarbonLevel();
  },

  getUserCarbonLevel() {
    const user = getApp().globalData.userInfo;
    let level = 'medium';
    if (user && user.lowCarbonCount !== undefined && user.totalDays > 0) {
      const lowPct = user.lowCarbonCount / user.totalDays;
      if (lowPct >= 0.7) level = 'low';
      else if (lowPct < 0.3) level = 'high';
    }
    if (getApp().globalData.cloudInited) {
      getApp()
        .cloudCall('getWeekStats', {}, { timeout: 5000, showLoading: false })
        .then((r) => {
          if (r.result && r.result.data && r.result.data.weekData) {
            const scored = r.result.data.weekData.filter((d) => d.scored);
            if (scored.length > 0) {
              const avgScore = scored.reduce((s, d) => s + d.score, 0) / scored.length;
              if (avgScore > 7) level = 'high';
              else if (avgScore < 4) level = 'low';
              else level = 'medium';
              this._applyLevel(level);
            }
          }
        })
        .catch(() => {});
    }
    this._applyLevel(level);
  },

  _applyLevel(level) {
    this.setData({
      userCarbonLevel: level,
      currentGuide:
        guideData[level] && guideData[level][this.data.selectedCategory]
          ? guideData[level][this.data.selectedCategory]
          : guideData.medium[this.data.selectedCategory],
    });
  },

  onCategoryTap(e) {
    try {
      const categoryId = e.currentTarget.dataset.id;
      if (guideData[this.data.userCarbonLevel] && guideData[this.data.userCarbonLevel][categoryId]) {
        this.setData({
          selectedCategory: categoryId,
          currentGuide: guideData[this.data.userCarbonLevel][categoryId],
        });
      } else {
        this.setData({
          selectedCategory: categoryId,
          currentGuide: guideData.medium[categoryId] || [],
        });
      }
    } catch (error) {
      console.error('Error in onCategoryTap:', error);
      this.setData({ currentGuide: [] });
    }
  },

  onPullDownRefresh() {
    this.getUserCarbonLevel();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },
});
