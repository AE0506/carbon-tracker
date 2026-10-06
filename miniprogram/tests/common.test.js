// tests/common.test.js — 碳迹评分算法单元测试
// 运行：node tests/common.test.js

const common = require('../cloudfunctions/common/index.js');
const { buildLocalUserPatch, buildLocalDeletePatch } = require('../utils/localStats');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    return;
  }
  failed++;
  console.error('  FAIL: ' + msg);
}

function assertEqual(actual, expected, msg) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    return;
  }
  failed++;
  console.error('  FAIL: ' + msg + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}

// ─── calcScore ───────────────────────────────
console.log('\n[calcScore]');
assertEqual(common.calcScore('walk', 'vegan', 'home'), 0, 'walk+vegan+home → 0');
assertEqual(common.calcScore('walk', 'vegan', 'outside'), 1, 'walk+vegan+outside → 1');
assertEqual(common.calcScore('car', 'high_carbon', 'outside'), 10, 'car+high_carbon+outside → 10');
assertEqual(common.calcScore('walk', 'normal', 'outside'), 4, 'walk+normal+outside → 4');
assertEqual(common.calcScore('car', 'vegan', 'outside'), 6, 'car+vegan+outside → 6');
assertEqual(common.calcScore('bus', 'normal', 'home'), 4, 'bus+normal+home → 4');
// car+high_carbon 组合惩罚 +1
assertEqual(common.calcScore('car', 'high_carbon', 'home'), 10, 'car+high_carbon+home → 10');
// walk+vegan 组合奖励 -1
assertEqual(common.calcScore('walk', 'vegan', 'outside'), 1, 'walk+vegan+outside → 1 (含-1奖励)');

// ─── calcTreeValue ───────────────────────────
console.log('\n[calcTreeValue]');
assertEqual(common.calcTreeValue(0), 10, 'score 0 → treeValue 10');
assertEqual(common.calcTreeValue(10), 0, 'score 10 → treeValue 0');
assertEqual(common.calcTreeValue(3), 7, 'score 3 → treeValue 7');
assertEqual(common.calcTreeValue(7), 3, 'score 7 → treeValue 3');

// ─── getTreeType ─────────────────────────────
console.log('\n[getTreeType]');
assertEqual(common.getTreeType(0), { type: 'seedling', level: 1, label: '小苗' }, 'treeValue 0 → seedling');
assertEqual(common.getTreeType(2), { type: 'seedling', level: 1, label: '小苗' }, 'treeValue 2 → seedling');
assertEqual(common.getTreeType(3), { type: 'small', level: 2, label: '小树' }, 'treeValue 3 → small');
assertEqual(common.getTreeType(5), { type: 'small', level: 2, label: '小树' }, 'treeValue 5 → small');
assertEqual(common.getTreeType(6), { type: 'medium', level: 3, label: '大树' }, 'treeValue 6 → medium');
assertEqual(common.getTreeType(8), { type: 'medium', level: 3, label: '大树' }, 'treeValue 8 → medium');
assertEqual(common.getTreeType(9), { type: 'giant', level: 4, label: '巨树' }, 'treeValue 9 → giant');
assertEqual(common.getTreeType(10), { type: 'giant', level: 4, label: '巨树' }, 'treeValue 10 → giant');

// ─── calcLevel ───────────────────────────────
console.log('\n[calcLevel]');
assertEqual(common.calcLevel(0), 1, '0 pts → Lv1');
assertEqual(common.calcLevel(29), 1, '29 pts → Lv1');
assertEqual(common.calcLevel(30), 2, '30 pts → Lv2');
assertEqual(common.calcLevel(79), 2, '79 pts → Lv2');
assertEqual(common.calcLevel(80), 3, '80 pts → Lv3');
assertEqual(common.calcLevel(250), 5, '250 pts → Lv5');
assertEqual(common.calcLevel(1800), 10, '1800 pts → Lv10');
assertEqual(common.calcLevel(2000), 10, '2000 pts → Lv10 (上限)');

// ─── calcPoints ──────────────────────────────
console.log('\n[calcPoints]');
assertEqual(common.calcPoints(0), 10, 'score 0 → 10 points');
assertEqual(common.calcPoints(10), 1, 'score 10 → 1 point');
assertEqual(common.calcPoints(5), 5, 'score 5 → 5 points');

// ─── isValidDate ─────────────────────────────
console.log('\n[isValidDate]');
assertEqual(common.isValidDate('2026-05-26'), true, '2026-05-26 → true');
assertEqual(common.isValidDate('2026-5-26'), false, '2026-5-26 → false (无前导零)');
assertEqual(common.isValidDate('2026-02-31'), false, '不存在日期 2026-02-31 → false');
assertEqual(common.isValidDate('2026-13-01'), false, '不存在月份 2026-13-01 → false');
assertEqual(common.isValidDate('2026-00-10'), false, '不存在月份 2026-00-10 → false');
assertEqual(common.isValidDate(''), false, '空字符串 → false');
assertEqual(common.isValidDate(null), false, 'null → false');
assertEqual(common.isValidDate(undefined), false, 'undefined → false');
assertEqual(common.isValidDate('not-a-date'), false, '非法日期 → false');

// ─── getWeekMonday ───────────────────────────
console.log('\n[getWeekMonday]');
assertEqual(common.getWeekMonday('2026-05-26'), '2026-05-25', '周二 → 周一');
assertEqual(common.getWeekMonday('2026-05-25'), '2026-05-25', '周一 → 周一');
assertEqual(common.getWeekMonday('2026-05-31'), '2026-05-25', '周日 → 周一');
assertEqual(common.getWeekMonday('2026-01-01'), '2025-12-29', '跨年周日');

// ─── calcIncrementalUpdate 新增场景 ──────────
console.log('\n[calcIncrementalUpdate 新增]');
(function () {
  const today = common.getToday();
  const user = {
    totalPoints: 0,
    totalDays: 0,
    lowCarbonCount: 0,
    walkCount: 0,
    veganCount: 0,
    giantTreeCount: 0,
    seedlingTreeCount: 0,
    smallTreeCount: 0,
    mediumTreeCount: 0,
    streak: 0,
    weekPoints: 0,
    weekPointsStart: common.getWeekMonday(today),
    lastRecordDate: common.getYesterday(today), // 昨天有记录
  };
  const action = { score: 0, points: 10, transport: 'walk', diet: 'vegan', treeType: 'seedling' };
  const result = common.calcIncrementalUpdate(user, action, false, null);

  assertEqual(result.totalDays, 1, '新增: totalDays=1');
  assertEqual(result.lowCarbonCount, 1, '新增: score=0 → lowCarbonCount=1');
  assertEqual(result.totalPoints, 10, '新增: totalPoints=10');
  assertEqual(result.walkCount, 1, '新增: transport=walk → walkCount=1');
  assertEqual(result.veganCount, 1, '新增: diet=vegan → veganCount=1');
  assertEqual(result.seedlingTreeCount, 1, '新增: treeType=seedling → seedlingTreeCount=1');
  assert(result.streak >= 1, '新增: streak >= 1');
})();

// ─── calcIncrementalUpdate 无历史记录 ─────────
console.log('\n[calcIncrementalUpdate 无历史]');
(function () {
  const user = {
    totalPoints: 0,
    totalDays: 0,
    lowCarbonCount: 0,
    walkCount: 0,
    veganCount: 0,
    giantTreeCount: 0,
    seedlingTreeCount: 0,
    smallTreeCount: 0,
    mediumTreeCount: 0,
    streak: 0,
    weekPoints: 0,
    weekPointsStart: '',
    lastRecordDate: null, // 无历史
  };
  const action = { score: 0, points: 10, transport: 'walk', diet: 'vegan', treeType: 'seedling' };
  const result = common.calcIncrementalUpdate(user, action, false, null);

  assertEqual(result.totalDays, 1, '无历史: totalDays=1');
  assertEqual(result.streak, 1, '无历史: streak=1 (新开始)');
})();

// ─── calcIncrementalUpdate 更新场景 ────────────
console.log('\n[calcIncrementalUpdate 更新]');
(function () {
  const today = common.getToday();
  const user = {
    totalPoints: 5,
    totalDays: 1,
    lowCarbonCount: 0,
    walkCount: 0,
    veganCount: 0,
    giantTreeCount: 0,
    seedlingTreeCount: 0,
    smallTreeCount: 0,
    mediumTreeCount: 1,
    streak: 1,
    weekPoints: 5,
    weekPointsStart: common.getWeekMonday(today),
    lastRecordDate: today,
  };
  // old: score=5 (不低碳, bus, normal, medium tree, 5 points)
  const oldAction = { score: 5, points: 5, transport: 'bus', diet: 'normal', treeType: 'medium' };
  // new: score=3 (低碳, walk, vegan, seedling tree, 7 points)
  const action = { score: 3, points: 7, transport: 'walk', diet: 'vegan', treeType: 'seedling' };
  const result = common.calcIncrementalUpdate(user, action, true, oldAction);

  assertEqual(result.totalDays, 1, '更新: totalDays 不变 = 1');
  assertEqual(result.totalPoints, 7, '更新: totalPoints = 5 + (7-5) = 7');
  assertEqual(result.lowCarbonCount, 1, '更新: score 5→3, lowCarbonCount +1');
  assertEqual(result.walkCount, 1, '更新: bus→walk, walkCount +1');
  assertEqual(result.veganCount, 1, '更新: normal→vegan, veganCount +1');
  assertEqual(result.mediumTreeCount, 0, '更新: medium→seedling, mediumTreeCount=0');
  assertEqual(result.seedlingTreeCount, 1, '更新: medium→seedling, seedlingTreeCount=1');
  assertEqual(result.streak, 1, '更新: streak 不变');
})();

// ─── shouldRecomputeStats ─────────────────────
console.log('\n[shouldRecomputeStats]');
assertEqual(
  common.shouldRecomputeStats('2026-06-15', '2026-06-16', '2026-06-16'),
  false,
  '今日记录且近期校准 → 增量更新'
);
assertEqual(common.shouldRecomputeStats('2026-06-15', '2026-06-15', '2026-06-16'), true, '离线补传旧日期 → 全量重算');
assertEqual(common.shouldRecomputeStats('2026-06-01', '2026-06-16', '2026-06-16'), true, '超过 7 天未校准 → 全量重算');

// ─── challenge helpers ─────────────────────────
console.log('\n[challenge helpers]');
(function () {
  const challenge = common.getDailyChallenge('2026-06-19');
  assert(!!challenge.id, '每日挑战存在 id');
  assert(challenge.bonus > 0 && challenge.bonus <= 8, '每日挑战奖励来自服务端白名单');
  assertEqual(common.getDailyChallenge('2026-06-19'), challenge, '同一天挑战稳定');
})();

// ─── localStats ───────────────────────────────
console.log('\n[localStats]');
(function () {
  const user = {
    totalPoints: 10,
    totalTrees: 1,
    totalDays: 1,
    lowCarbonCount: 1,
    walkCount: 1,
    veganCount: 1,
    seedlingTreeCount: 1,
    weekPoints: 10,
    weekPointsStart: common.getWeekMonday('2026-06-19'),
  };
  const oldAction = { score: 0, pts: 10, transport: 'walk', diet: 'vegan', treeType: 'seedling', date: '2026-06-19' };
  const nextAction = { score: 5, pts: 5, transport: 'bus', diet: 'normal', treeType: 'small', date: '2026-06-19' };
  const update = buildLocalUserPatch(user, nextAction, oldAction);
  assertEqual(update.totalDays, 1, '本地修改记录不增加 totalDays');
  assertEqual(update.totalPoints, 5, '本地修改记录按积分差值更新');
  assertEqual(update.weekPoints, 5, '本地修改记录同步扣回周积分差值');
  assertEqual(update.seedlingTreeCount, 0, '本地修改记录扣回旧树类型');
  assertEqual(update.smallTreeCount, 1, '本地修改记录增加新树类型');
  const deleted = buildLocalDeletePatch(update, nextAction);
  assertEqual(deleted.totalDays, 0, '本地删除记录扣回 totalDays');
  assertEqual(deleted.totalPoints, 0, '本地删除记录扣回积分');
  assertEqual(deleted.weekPoints, 0, '本地删除记录扣回周积分');
})();

// ─── 结果汇总 ─────────────────────────────────
console.log('\n' + '='.repeat(50));
console.log('结果: ' + passed + ' 通过, ' + failed + ' 失败, ' + (passed + failed) + ' 总计');
if (failed > 0) {
  console.log('❌ 有 ' + failed + ' 个测试失败');
  process.exit(1);
} else {
  console.log('✅ 全部通过');
}
