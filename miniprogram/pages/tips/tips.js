// pages/tips/tips.js  低碳知识库 v2-增强搜索与分类
const { KEYS } = require('../../utils/storage');
const { TIPS, CATS } = require('../../data/tips-data');

Page({
  data: {
    cats: CATS,
    activeCat: 'all',
    tips: TIPS,
    filtered: TIPS,
    favorites: [],
    showDetail: false,
    detail: null,
    searchKey: '',
    showSearch: false,
  },
  onLoad() {
    try {
      this.setData({ favorites: wx.getStorageSync(KEYS.FAVORITES) || [] });
    } catch (e) {}
  },
  onShareAppMessage() {
    return { title: '低碳知识库 · 碳迹小程序', path: '/pages/tips/tips' };
  },
  onCatTap(e) {
    const key = e.currentTarget.dataset.key;
    const filtered = key === 'all' ? TIPS : TIPS.filter((t) => t.cat === key);
    this.setData({ activeCat: key, filtered, searchKey: '' });
  },
  onSearchInput(e) {
    const key = e.detail.value.trim();
    this.setData({ searchKey: key });
    if (key.length > 0) {
      const filtered = TIPS.filter((t) => t.title.includes(key) || t.body.includes(key));
      this.setData({ filtered, activeCat: 'all' });
    } else {
      this.setData({ filtered: TIPS });
    }
  },
  onClearSearch() {
    this.setData({ searchKey: '', filtered: TIPS });
  },
  onToggleSearch() {
    this.setData({ showSearch: !this.data.showSearch, searchKey: '', filtered: TIPS });
  },
  onTipTap(e) {
    const id = e.currentTarget.dataset.id;
    const detail = TIPS.find((t) => t.id === id);
    if (detail) this.setData({ showDetail: true, detail });
  },
  onCloseDetail() {
    this.setData({ showDetail: false, detail: null });
  },
  onToggleFav(e) {
    const id = e.currentTarget.dataset.id;
    const favs = [...this.data.favorites];
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(id);
    this.setData({ favorites: favs });
    try {
      wx.setStorageSync(KEYS.FAVORITES, favs);
    } catch (e) {}
  },
  isFav(id) {
    return this.data.favorites.includes(id);
  },
});
