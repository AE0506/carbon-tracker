const { isOnboardingDone, setOnboardingDone } = require('../../utils/storage');
const SLIDES = [
  { icon: '🌍', title: '记录低碳行为', desc: '每天只需 5 秒，选择你的出行、饮食和生活状态，完成今日打卡。' },
  { icon: '🌳', title: '种下你的树', desc: '越环保的行为，种出越大的树。积累你的专属虚拟森林！' },
  { icon: '🏆', title: '解锁成就徽章', desc: '连续打卡、持续低碳，解锁专属徽章，成为地球守护者！' },
];
Page({
  data: { slides: SLIDES, current: 0, isLast: false },
  onLoad() {
    if (isOnboardingDone()) {
      wx.switchTab({ url: '/pages/index/index' });
      return;
    }
    this.setData({ isLast: SLIDES.length === 1 });
  },
  onSwiperChange(e) {
    const idx = e.detail.current;
    this.setData({ current: idx, isLast: idx === SLIDES.length - 1 });
  },
  onNext() {
    if (!this.data.isLast) {
      const n = this.data.current + 1;
      this.setData({ current: n, isLast: n === SLIDES.length - 1 });
    } else {
      this._finish();
    }
  },
  onSkip() {
    this._finish();
  },
  _finish() {
    setOnboardingDone();
    wx.switchTab({ url: '/pages/index/index' });
  },
});
