Page({
  data: { trees: [], stats: null, loading: true, selTree: null, showDetail: false, error: null, gridCols: 4 },
  onLoad() {
    const { screenWidth } = wx.getWindowInfo();
    this.setData({ gridCols: screenWidth < 375 ? 3 : 4 });
    this._load();
  },
  onShow() {
    this._load();
  },
  onPullDownRefresh() {
    this._load();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1500);
  },
  _load() {
    this.setData({ loading: true, error: null });
    if (!getApp().globalData.cloudInited) {
      this.setData({
        trees: [],
        stats: { totalTrees: 0, giantCount: 0, mediumCount: 0, smallCount: 0, seedlingCount: 0, co2Saved: 0 },
        loading: false,
      });
      return;
    }
    getApp()
      .cloudCall('getForest', { limit: 90 }, { timeout: 15000, showLoading: false })
      .then((r) => {
        if (!r.result || !r.result.success) throw new Error((r.result && r.result.error) || '加载失败');
        const { trees, stats } = r.result.data;
        const cols = this.data.gridCols;
        const padded = [...trees];
        while (padded.length % cols !== 0) padded.push(null);
        this.setData({ trees: padded, stats, loading: false });
      })
      .catch((err) => {
        console.error('[forest] 加载失败', err);
        this.setData({ loading: false, error: '加载失败，下拉刷新重试' });
      });
  },
  onRetry() {
    this._load();
  },
  onTreeTap(e) {
    const t = e.currentTarget.dataset.tree;
    if (!t) return;
    this.setData({ selTree: t, showDetail: true });
  },
  onCloseDetail() {
    this.setData({ showDetail: false, selTree: null });
  },
  onShareAppMessage() {
    const s = this.data.stats;
    return {
      title: s ? '我的碳迹森林已有' + s.totalTrees + '棵树，快来一起种！' : '碳迹 · 我的低碳虚拟森林',
      path: '/pages/forest/forest',
    };
  },
});
