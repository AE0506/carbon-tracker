// utils/syncQueue.js v6.7 — 离线同步队列
// 网络断开时将 saveAction 请求暂存本地，网络恢复后自动重放
// 集成点：app.js 的 _silentRefresh、record.js 的 catch
const STORAGE_KEY = 'ct_sync_queue';
const MAX_RETRIES = 3;

function _load() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || [];
  } catch (_) {
    return [];
  }
}

function _save(queue) {
  try {
    wx.setStorageSync(STORAGE_KEY, queue);
  } catch (_) {}
}

/**
 * 入队一条待同步数据
 * @param {object} actionData - saveAction 云函数参数 {transport, diet, status, date}
 */
function enqueue(actionData) {
  const queue = _load();
  // 去重：同一日期只保留最新一条
  const filtered = queue.filter((item) => item.data.date !== actionData.date);
  filtered.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    data: actionData,
    retries: 0,
    createdAt: Date.now(),
  });
  _save(filtered);
}

/**
 * 清空队列并同步所有待发送数据
 * @returns {Promise<{synced: number, failed: number, remaining: number}>}
 */
function flush() {
  const queue = _load();
  if (queue.length === 0) return Promise.resolve({ synced: 0, failed: 0, remaining: 0 });

  let synced = 0;
  let failed = 0;

  function processNext(index) {
    if (index >= queue.length) {
      const remaining = queue.filter((item) => !item.synced);
      _save(remaining);
      return { synced, failed, remaining: remaining.length };
    }

    const item = queue[index];
    return new Promise((resolve) => {
      wx.cloud
        .callFunction({ name: 'saveAction', data: item.data })
        .then((r) => {
          if (r.result && r.result.success) {
            synced++;
            item.synced = true;
          } else {
            failed++;
            item.retries = Math.min(MAX_RETRIES, item.retries + 1);
          }
        })
        .catch(() => {
          failed++;
          item.retries = Math.min(MAX_RETRIES, item.retries + 1);
        })
        .finally(() => resolve(processNext(index + 1)));
    });
  }

  return processNext(0);
}

/**
 * 获取当前队列长度
 * @returns {number}
 */
function getQueueLength() {
  return _load().length;
}

/**
 * 条件刷新：网络可用且有排队数据时自动同步
 * 由 app.js 的网络恢复 / 启动流程调用
 * @returns {Promise<void>}
 */
async function tryFlush() {
  if (getQueueLength() === 0) {
    getApp().globalData.cloudOutOfSync = false;
    return { synced: 0, failed: 0, remaining: 0 };
  }
  const result = await flush();
  getApp().globalData.cloudOutOfSync = result.remaining > 0;
  if (result.synced > 0 && result.remaining === 0) {
    // 同步成功后刷新用户信息
    try {
      const loginRes = await wx.cloud.callFunction({ name: 'login', data: {} });
      if (loginRes.result && loginRes.result.success && loginRes.result.data) {
        getApp().updateUserInfo(loginRes.result.data.userInfo);
      }
    } catch (_) {}
  }
  return result;
}

module.exports = { enqueue, flush, getQueueLength, tryFlush };
