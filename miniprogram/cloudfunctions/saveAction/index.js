// saveAction v6.7 — 使用 common 共享模块，统一响应格式
// 优化点：
//   [增量] recomputeUserStats 改为增量策略，不再每次查全量 actions
//   [周榜] 同步维护 users.weekPoints/weekPointsStart
//   [森林] 同步维护 users 树类型计数
//   [校准] lastRecomputeDate 超7天触发全量重算
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const {
  getToday,
  getWeekMonday,
  isValidDate,
  VALID_TRANSPORT,
  VALID_DIET,
  VALID_STATUS,
  calcScore,
  calcTreeValue,
  getTreeType,
  calcPoints,
  calcLevel,
  TRIGGERS,
  getDailyChallenge,
  recomputeUserStats,
  calcIncrementalUpdate,
  shouldRecomputeStats,
} = require('./common.js');

async function claimChallengeBonus(event, openid) {
  const today = getToday();
  const date = event.date || today;
  if (date !== today) return { success: false, error: '只能领取当天挑战奖励' };
  if (!event.challengeId) return { success: false, error: '缺少 challengeId' };

  const challenge = getDailyChallenge(today);
  if (event.challengeId !== challenge.id) return { success: false, error: '挑战ID与今日挑战不匹配' };
  if (event.challengeBonus !== undefined && event.challengeBonus !== challenge.bonus) {
    return { success: false, error: '挑战奖励积分不合法' };
  }

  const actionCol = db.collection('actions');
  const actionRes = await actionCol.where({ openid, date }).limit(1).get();
  const action = actionRes.data[0];
  if (!challenge.check(action)) return { success: false, error: '今日记录未完成挑战条件' };

  const claimCol = db.collection('challengeClaims');
  const existing = await claimCol.where({ openid, date, challengeId: challenge.id }).limit(1).get();
  if (existing.data.length) return { success: false, error: '今日挑战奖励已领取' };

  const userCol = db.collection('users');
  const uRes = await userCol.where({ openid }).limit(1).get();
  if (!uRes.data.length) return { success: false, error: '用户不存在' };
  const user = uRes.data[0];
  const newPts = Math.max(0, (user.totalPoints || 0) + challenge.bonus);
  const newLv = calcLevel(newPts);
  const weekStart = getWeekMonday(today);
  const currentWeekPoints = user.weekPointsStart === weekStart ? user.weekPoints || 0 : 0;

  await claimCol.add({
    data: {
      openid,
      date,
      challengeId: challenge.id,
      bonus: challenge.bonus,
      createTime: db.serverDate(),
    },
  });
  await userCol.doc(user._id).update({
    data: {
      totalPoints: newPts,
      level: newLv,
      weekPoints: currentWeekPoints + challenge.bonus,
      weekPointsStart: weekStart,
      updateTime: db.serverDate(),
    },
  });

  return {
    success: true,
    data: {
      challengeId: challenge.id,
      challengeBonus: challenge.bonus,
      newTotalPoints: newPts,
      newLevel: newLv,
      weekPoints: currentWeekPoints + challenge.bonus,
      weekPointsStart: weekStart,
    },
  };
}

// ─── 主函数 ─────────────────────────────────────
/**
 * 保存/更新碳迹记录 — 验证出行/饮食/生活参数，计算碳积分与树，增量更新用户统计，超7天自动全量校准
 * @param {object} event - 云函数调用参数
 * @param {string} event.transport - 出行方式
 * @param {string} event.diet - 饮食方式
 * @param {string} event.status - 生活状态
 * @param {string} event.date - 记录日期（YYYY-MM-DD）
 * @param {number} [event.challengeBonus] - 可选挑战积分
 * @param {object} context - 微信云调用上下文
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
exports.main = async (event, _context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '鉴权失败' };

  if (event.challengeId && !event.transport) {
    try {
      return await claimChallengeBonus(event, OPENID);
    } catch (err) {
      console.error('[saveAction:challenge]', err);
      return { success: false, error: err.message };
    }
  }

  const { transport, diet, status, date } = event;

  if (VALID_TRANSPORT[transport] === undefined) {
    return { success: false, error: '无效的出行方式: ' + transport };
  }
  if (VALID_DIET[diet] === undefined) {
    return { success: false, error: '无效的饮食方式: ' + diet };
  }
  if (VALID_STATUS[status] === undefined) {
    return { success: false, error: '无效的生活状态: ' + status };
  }
  if (!isValidDate(date)) {
    return { success: false, error: '日期格式错误，需为 YYYY-MM-DD' };
  }

  const score = calcScore(transport, diet, status);
  const tv = calcTreeValue(score);
  const ti = getTreeType(tv);
  const points = calcPoints(score);
  const isLow = score <= 3;

  try {
    const userCol = db.collection('users');
    const actionCol = db.collection('actions');
    const treeCol = db.collection('trees');

    const uRes = await userCol.where({ openid: OPENID }).get();
    if (!uRes.data.length) return { success: false, error: '用户不存在' };
    const user = uRes.data[0];

    const exA = await actionCol.where({ openid: OPENID, date }).get();
    const isUpdate = exA.data.length > 0;
    const oldAction = isUpdate ? exA.data[0] : null;
    const actionData = {
      openid: OPENID,
      date,
      transport,
      diet,
      status,
      score,
      points,
      isLowCarbon: isLow,
      treeValue: tv,
      treeType: ti.type,
      treeLevel: ti.level,
      updateTime: db.serverDate(),
    };
    if (isUpdate) {
      await actionCol.doc(exA.data[0]._id).update({ data: actionData });
    } else {
      await actionCol.add({ data: { ...actionData, createTime: db.serverDate() } });
    }

    const exT = await treeCol.where({ openid: OPENID, date }).get();
    const treeData = {
      openid: OPENID,
      date,
      carbonScore: score,
      treeValue: tv,
      treeLevel: ti.level,
      treeType: ti.type,
      label: ti.label,
      updateTime: db.serverDate(),
    };
    if (exT.data.length > 0) {
      await treeCol.doc(exT.data[0]._id).update({ data: treeData });
    } else {
      await treeCol.add({ data: { ...treeData, createTime: db.serverDate() } });
    }

    // ── 用户统计更新 ──────────────────────────
    const today = getToday();
    const lastRecompute = user.lastRecomputeDate || '';

    let stats;
    if (shouldRecomputeStats(lastRecompute, date, today)) {
      stats = await recomputeUserStats(db, OPENID);
      stats.lastRecomputeDate = today;
    } else {
      const inc = calcIncrementalUpdate(user, actionData, isUpdate, oldAction);
      stats = { ...inc, lastRecomputeDate: lastRecompute };
    }

    const newMaxStreak = Math.max(user.maxStreak || 0, stats.streak);

    const unlocked = [...(user.unlockedBadges || [])];
    const newBadges = [];
    TRIGGERS.forEach((t) => {
      if (!unlocked.includes(t.id) && t.check(stats)) {
        unlocked.push(t.id);
        newBadges.push(t.id);
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
        weekPointsStart: stats.weekPointsStart || getWeekMonday(today),
        streak: stats.streak,
        maxStreak: newMaxStreak,
        level: stats.level,
        unlockedBadges: unlocked,
        lastRecordDate: date,
        lastRecomputeDate: stats.lastRecomputeDate,
        updateTime: db.serverDate(),
      },
    });

    return {
      success: true,
      data: {
        score,
        points,
        isLowCarbon: isLow,
        treeValue: tv,
        treeType: ti.type,
        treeLabel: ti.label,
        treeLevel: ti.level,
        newTotalPoints: stats.totalPoints,
        newLevel: stats.level,
        newBadges,
        streak: stats.streak,
        totalTrees: stats.totalDays,
        totalDays: stats.totalDays,
        lowCarbonCount: stats.lowCarbonCount,
        walkCount: stats.walkCount,
        veganCount: stats.veganCount,
        giantTreeCount: stats.giantTreeCount,
        seedlingTreeCount: stats.seedlingTreeCount || 0,
        smallTreeCount: stats.smallTreeCount || 0,
        mediumTreeCount: stats.mediumTreeCount || 0,
        weekPoints: stats.weekPoints || 0,
        weekPointsStart: stats.weekPointsStart || getWeekMonday(today),
      },
    };
  } catch (err) {
    console.error('[saveAction]', err);
    return { success: false, error: err.message };
  }
};
