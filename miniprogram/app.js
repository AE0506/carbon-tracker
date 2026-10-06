// app.js  v6.7 — 树类型统计 + 离线脏标记
// ═══════════════════════════════════════════════
// 部署步骤：
//   1. 微信开发者工具 → 云开发 → 设置 → 复制环境ID
//   2. 如需指定环境，将 config/env.js 中 CLOUD_ENV_ID 替换为真实环境ID
//   3. 云开发控制台 → 数据库 → 创建集合: users / actions / trees / challengeClaims
//   4. 右键 cloudfunctions 目录 → 上传并部署所有云函数
// 未指定环境ID时，使用微信开发者工具/云开发控制台选择的默认环境
// ═══════════════════════════════════════════════
const { KEYS } = require('./utils/storage');
const syncQueue = require('./utils/syncQueue');
const { CLOUD_ENV_ID } = require('./config/env');

App({
  globalData: {
    isLogin: false,
    openid: null,
    userInfo: null,
    loginReady: false,
    cloudInited: false,
    isOnline: true,
    cloudOutOfSync: false,
    _loginCallbacks: [],
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('[碳迹] 基础库版本过低，请升级到 2.2.3+');
      this._failWithDefault('基础库版本过低');
      return;
    }

    // 全局未捕获异常处理 — 降级而非崩溃
    if (typeof wx.onUnhandledRejection === 'function') {
      wx.onUnhandledRejection((res) => {
        console.error('[碳迹] 未捕获的Promise异常:', res.reason);
      });
    }

    // 全局网络状态监听
    wx.onNetworkStatusChange((res) => {
      const prev = this.globalData.isOnline;
      this.globalData.isOnline = res.isConnected;
      if (!prev && res.isConnected) {
        console.log('[碳迹] 网络已恢复');
        this._syncThenRefresh();
      }
      if (prev && !res.isConnected) {
        console.warn('[碳迹] 网络已断开');
      }
    });

    // 获取初始网络状态
    wx.getNetworkType({
      success: (res) => {
        this.globalData.isOnline = res.networkType !== 'none';
      },
    });

    try {
      const cloudOptions = CLOUD_ENV_ID ? { env: CLOUD_ENV_ID, traceUser: true } : { traceUser: true };
      wx.cloud.init(cloudOptions);
      this.globalData.cloudInited = true;
    } catch (e) {
      console.error('[碳迹] 云开发初始化失败', e);
      this._failWithDefault('云开发初始化失败');
      return;
    }

    this._startLogin();
  },

  // ─── 统一云函数调用 ──────────────────────────────
  cloudCall(name, data = {}, options = {}) {
    const { timeout = 10000, showLoading = false, loadingText = '加载中...' } = options;

    if (!this.globalData.isOnline) {
      return Promise.reject(new Error('网络已断开'));
    }

    if (showLoading) {
      wx.showLoading({ title: loadingText, mask: true });
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (showLoading) wx.hideLoading();
        reject(new Error('请求超时，请检查网络'));
      }, timeout);

      wx.cloud
        .callFunction({ name, data })
        .then((r) => {
          clearTimeout(timer);
          if (showLoading) wx.hideLoading();
          if (r.errMsg && r.errMsg.includes('fail')) {
            reject(new Error(r.errMsg));
          } else if (r.result && r.result.success === false) {
            reject(new Error(r.result.error || '云函数业务处理失败'));
          } else {
            resolve(r);
          }
        })
        .catch((err) => {
          clearTimeout(timer);
          if (showLoading) wx.hideLoading();
          console.error(`[碳迹] 云函数 ${name} 调用失败`, err);
          reject(err);
        });
    });
  },

  onLoginReady(cb) {
    if (this.globalData.loginReady) {
      cb(this.globalData.userInfo);
    } else {
      this.globalData._loginCallbacks.push(cb);
    }
  },

  // ─── 登录主流程 ─────────────────────────────────
  _startLogin() {
    const cached = this._getCache();
    if (cached) {
      this._ok(cached.openid, cached.userInfo);
      this._syncThenRefresh();
    } else {
      this._login();
    }
  },

  _login() {
    const timer = setTimeout(() => {
      console.warn('[碳迹] 登录超时，进入离线模式');
      this._failWithDefault('网络超时，以本地模式运行');
    }, 15000);

    wx.login({
      success: (res) => {
        if (!res.code) {
          clearTimeout(timer);
          this._failWithDefault('wx.login 未返回 code');
          return;
        }
        wx.cloud
          .callFunction({ name: 'login', data: { code: res.code } })
          .then((r) => {
            clearTimeout(timer);
            if (!r.result || !r.result.success) {
              this._failWithDefault('云函数登录失败');
              return;
            }
            this._ok(r.result.data.openid, r.result.data.userInfo);
            this._setCache(r.result.data.openid, r.result.data.userInfo);
            this._syncThenRefresh();
          })
          .catch((err) => {
            clearTimeout(timer);
            console.error('[碳迹] login 云函数调用失败', err);
            this._failWithDefault('云函数不可用');
          });
      },
      fail: (err) => {
        clearTimeout(timer);
        console.error('[碳迹] wx.login 失败', err);
        this._failWithDefault('微信登录失败');
      },
    });
  },

  _silentRefresh() {
    if (!this.globalData.cloudInited || !this.globalData.isOnline) return;
    this.cloudCall('login', {}, { timeout: 8000 })
      .then((r) => {
        if (r.result && r.result.success) {
          this.globalData.userInfo = r.result.data.userInfo;
          this.globalData.cloudOutOfSync = syncQueue.getQueueLength() > 0;
          this._setCache(r.result.data.openid, r.result.data.userInfo);
          getCurrentPages().forEach((p) => {
            if (typeof p.onUserDataRefresh === 'function') {
              p.onUserDataRefresh(r.result.data.userInfo);
            }
          });
        }
      })
      .catch(() => {}); // 静默失败
  },

  _syncThenRefresh() {
    if (!this.globalData.cloudInited || !this.globalData.isOnline) return;
    syncQueue
      .tryFlush()
      .catch(() => ({ synced: 0, failed: syncQueue.getQueueLength(), remaining: syncQueue.getQueueLength() }))
      .then(() => {
        this._silentRefresh();
      });
  },

  // ─── 登录成功 ───────────────────────────────────
  _ok(openid, userInfo) {
    this.globalData.openid = openid;
    this.globalData.userInfo = userInfo || this._defaultUser();
    this.globalData.isLogin = !!openid;
    this.globalData.loginReady = true;
    const cbs = this.globalData._loginCallbacks;
    while (cbs.length) cbs.shift()(this.globalData.userInfo);
  },

  // ─── 更新用户信息并广播到所有页面 ──────────────
  updateUserInfo(stats) {
    if (!stats || !this.globalData.userInfo) return;
    const u = this.globalData.userInfo;
    if (stats.totalPoints !== undefined) u.totalPoints = stats.totalPoints;
    if (stats.totalTrees !== undefined) u.totalTrees = stats.totalTrees;
    if (stats.streak !== undefined) u.streak = stats.streak;
    if (stats.level !== undefined) u.level = stats.level;
    if (stats.lowCarbonCount !== undefined) u.lowCarbonCount = stats.lowCarbonCount;
    if (stats.walkCount !== undefined) u.walkCount = stats.walkCount;
    if (stats.veganCount !== undefined) u.veganCount = stats.veganCount;
    if (stats.giantTreeCount !== undefined) u.giantTreeCount = stats.giantTreeCount;
    if (stats.seedlingTreeCount !== undefined) u.seedlingTreeCount = stats.seedlingTreeCount;
    if (stats.smallTreeCount !== undefined) u.smallTreeCount = stats.smallTreeCount;
    if (stats.mediumTreeCount !== undefined) u.mediumTreeCount = stats.mediumTreeCount;
    if (stats.weekPoints !== undefined) u.weekPoints = stats.weekPoints;
    if (stats.weekPointsStart !== undefined) u.weekPointsStart = stats.weekPointsStart;
    if (stats.totalDays !== undefined) u.totalDays = stats.totalDays;
    if (stats.maxStreak !== undefined) u.maxStreak = stats.maxStreak;
    if (stats.lastRecordDate !== undefined) u.lastRecordDate = stats.lastRecordDate;
    if (stats.unlockedBadges !== undefined) u.unlockedBadges = stats.unlockedBadges;
    this._setCache(this.globalData.openid, u);
    getCurrentPages().forEach(function (p) {
      if (typeof p.onUserDataRefresh === 'function') {
        p.onUserDataRefresh(u);
      }
    });
  },

  _failWithDefault(reason) {
    console.warn('[碳迹] 降级到本地模式:', reason);
    // 云函数不可访问时停止后续页面请求，避免在离线模式中反复产生调用错误。
    this.globalData.cloudInited = false;
    this._ok(null, this._defaultUser());
  },

  _defaultUser() {
    return {
      nickname: '低碳践行者',
      avatarUrl: '',
      level: 1,
      totalPoints: 0,
      totalDays: 0,
      totalTrees: 0,
      lowCarbonCount: 0,
      walkCount: 0,
      veganCount: 0,
      giantTreeCount: 0,
      seedlingTreeCount: 0,
      smallTreeCount: 0,
      mediumTreeCount: 0,
      streak: 0,
      maxStreak: 0,
      lastRecordDate: null,
      weekPoints: 0,
      weekPointsStart: '',
      unlockedBadges: [],
    };
  },

  // ─── 本地缓存（30天有效）────────────────────────
  _setCache(openid, userInfo) {
    try {
      wx.setStorageSync(KEYS.LOGIN, {
        openid,
        userInfo,
        expireAt: Date.now() + 30 * 24 * 3600 * 1000,
      });
    } catch (e) {
      /* 存储空间满则跳过 */
    }
  },

  _getCache() {
    try {
      const c = wx.getStorageSync(KEYS.LOGIN);
      if (c && c.expireAt > Date.now()) return c;
      wx.removeStorageSync(KEYS.LOGIN);
    } catch (e) {
      /* ignore */
    }
    return null;
  },

  clearLoginCache() {
    wx.removeStorageSync(KEYS.LOGIN);
    this.globalData.isLogin = false;
    this.globalData.openid = null;
    this.globalData.userInfo = null;
    this.globalData.loginReady = false;
  },
});
