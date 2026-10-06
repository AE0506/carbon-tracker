// tests/syncQueue.test.js — 离线同步队列回归测试

const syncQueue = require('../utils/syncQueue');

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, msg) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    return;
  }
  failed++;
  console.error('  FAIL: ' + msg + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}

async function run() {
  console.log('\n[syncQueue]');
  const storage = {};
  const responses = [{ result: { success: true } }, { result: { success: false, error: 'mock fail' } }];
  const saveCalls = [];
  const app = {
    globalData: { cloudOutOfSync: true },
    updateUserInfo(userInfo) {
      this.userInfo = userInfo;
    },
  };

  global.getApp = () => app;
  global.wx = {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    cloud: {
      callFunction(args) {
        if (args.name === 'login')
          return Promise.resolve({ result: { success: true, data: { userInfo: { totalPoints: 1 } } } });
        saveCalls.push(args.data);
        return Promise.resolve(responses.shift());
      },
    },
  };

  syncQueue.enqueue({ date: '2026-06-18', transport: 'walk', diet: 'vegan', status: 'home' });
  syncQueue.enqueue({ date: '2026-06-19', transport: 'bus', diet: 'normal', status: 'outside' });
  const result = await syncQueue.tryFlush();

  assertEqual(result, { synced: 1, failed: 1, remaining: 1 }, '部分失败时返回 remaining=1');
  assertEqual(syncQueue.getQueueLength(), 1, '部分失败时保留未同步记录');
  assertEqual(app.globalData.cloudOutOfSync, true, '部分失败时保持同步告警');

  responses.push({ result: { success: true } });
  const recovered = await syncQueue.tryFlush();
  assertEqual(recovered, { synced: 1, failed: 0, remaining: 0 }, '网络恢复后成功同步遗留记录');
  assertEqual(syncQueue.getQueueLength(), 0, '同步成功后清空队列');
  assertEqual(app.globalData.cloudOutOfSync, false, '同步成功后清除同步告警');
  assertEqual(app.userInfo, { totalPoints: 1 }, '同步成功后刷新用户资料');

  syncQueue.enqueue({ date: '2026-06-20', transport: 'car', diet: 'normal', status: 'outside' });
  syncQueue.enqueue({ date: '2026-06-20', transport: 'bus', diet: 'vegan', status: 'home' });
  responses.push({ result: { success: true } });
  await syncQueue.tryFlush();
  assertEqual(saveCalls[saveCalls.length - 1], { date: '2026-06-20', transport: 'bus', diet: 'vegan', status: 'home' }, '同日修改只同步最新记录');

  console.log('\n' + '='.repeat(50));
  console.log('结果: ' + passed + ' 通过, ' + failed + ' 失败, ' + (passed + failed) + ' 总计');
  if (failed > 0) process.exit(1);
  console.log('✅ 全部通过');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
