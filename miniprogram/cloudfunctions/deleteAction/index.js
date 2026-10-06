// deleteAction v6.7 — 使用 common 共享模块，全量重算保证数据准确
// 优化点：
//   [共享] 复用 common 模块的评分、等级、成就、重算逻辑
//   [全量] 删除为低频操作，始终全量重算保证准确
//   [森林] 同步维护树类型计数和 weekPoints 字段
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const { getToday, isValidDate, getWeekMonday, TRIGGERS, recomputeUserStats } = require('./common.js');

/**
 * 删除当天碳迹记录 — 删除 actions/trees 中的当日记录，全量重算用户统计保证数据准确，成就只加不删
 * @param {object} event - 云函数调用参数
 * @param {string} event.date - 要删除的记录日期（YYYY-MM-DD，仅允许当天）
 * @param {object} context - 微信云调用上下文
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
exports.main = async (event, _context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '鉴权失败' };

  const { date } = event;
  if (!date) return { success: false, error: '参数缺失' };
  if (!isValidDate(date)) return { success: false, error: '日期格式错误，需为 YYYY-MM-DD' };
  if (date !== getToday()) return { success: false, error: '只能删除当天的记录' };

  try {
    const userCol = db.collection('users');
    const actionCol = db.collection('actions');
    const treeCol = db.collection('trees');

    const uRes = await userCol.where({ openid: OPENID }).get();
    if (!uRes.data.length) return { success: false, error: '用户不存在' };
    const user = uRes.data[0];

    const aRes = await actionCol.where({ openid: OPENID, date }).get();
    if (!aRes.data.length) return { success: false, error: '记录不存在' };
    const action = aRes.data[0];

    // 删除 action + tree
    await actionCol.doc(action._id).remove();
    const tRes = await treeCol.where({ openid: OPENID, date }).get();
    if (tRes.data.length > 0) await treeCol.doc(tRes.data[0]._id).remove();

    // ── 全量重算（删除低频，保证准确）──
    const today = getToday();
    const stats = await recomputeUserStats(db, OPENID);
    const newMaxStreak = Math.max(user.maxStreak || 0, stats.streak);

    // 成就只加不删
    const unlocked = [...(user.unlockedBadges || [])];
    TRIGGERS.forEach((t) => {
      if (!unlocked.includes(t.id) && t.check(stats)) {
        unlocked.push(t.id);
      }
    });

    await userCol.doc(user._id).update({
      data: {
        totalPoints: stats.totalPoints,
        totalDays: stats.totalDays,
        totalTrees: stats.totalDays,
        lowCarbonCount: stats.lowCarbonCount,
        walkCount: stats.walkCount,
        veganCount: stats.veganCount,
        giantTreeCount: stats.giantTreeCount,
        seedlingTreeCount: stats.seedlingTreeCount || 0,
        smallTreeCount: stats.smallTreeCount || 0,
        mediumTreeCount: stats.mediumTreeCount || 0,
        weekPoints: stats.weekPoints || 0,
        weekPointsStart: getWeekMonday(today),
        streak: stats.streak,
        maxStreak: newMaxStreak,
        level: stats.level,
        unlockedBadges: unlocked,
        lastRecordDate: stats.lastRecordDate,
        lastRecomputeDate: today,
        updateTime: db.serverDate(),
      },
    });

    return {
      success: true,
      data: {
        totalPoints: stats.totalPoints,
        totalDays: stats.totalDays,
        totalTrees: stats.totalDays,
        lowCarbonCount: stats.lowCarbonCount,
        walkCount: stats.walkCount,
        veganCount: stats.veganCount,
        giantTreeCount: stats.giantTreeCount,
        seedlingTreeCount: stats.seedlingTreeCount || 0,
        smallTreeCount: stats.smallTreeCount || 0,
        mediumTreeCount: stats.mediumTreeCount || 0,
        weekPoints: stats.weekPoints || 0,
        weekPointsStart: getWeekMonday(today),
        streak: stats.streak,
        maxStreak: newMaxStreak,
        level: stats.level,
        unlockedBadges: unlocked,
        lastRecordDate: stats.lastRecordDate,
      },
    };
  } catch (err) {
    console.error('[deleteAction]', err);
    return { success: false, error: err.message };
  }
};
