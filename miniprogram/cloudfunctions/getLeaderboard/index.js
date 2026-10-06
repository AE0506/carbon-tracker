// getLeaderboard v6.7 — 使用 common 共享模块
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const { getWeekMonday } = require('./common.js');

/**
 * 获取周榜+总榜排名（各前20），weekPoints 查询失败时自动回退到 actions 表扫描聚合
 * @param {object} event - 云函数调用参数，可选 weekStart（YYYY-MM-DD 格式）
 * @param {object} context - 微信云调用上下文
 * @returns {Promise<{success: boolean, data?: {weekList: object[], totalList: object[], myRank: number|null}, error?: string}>}
 */
exports.main = async (event, _context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '鉴权失败' };

  const { weekStart } = event;

  try {
    // 用 common 模块计算周起始日
    let start;
    if (weekStart && typeof weekStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      start = getWeekMonday(weekStart);
    } else {
      start = getWeekMonday(new Date().toISOString().slice(0, 10));
    }
    // 计算周日
    const mon = new Date(start);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const end =
      sun.getFullYear() +
      '-' +
      String(sun.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(sun.getDate()).padStart(2, '0');

    let weekList = [];
    try {
      const weekUsers = await db
        .collection('users')
        .where({ weekPointsStart: start, weekPoints: db.command.gt(0) })
        .orderBy('weekPoints', 'desc')
        .limit(20)
        .get();

      weekList = weekUsers.data.map((u, i) => ({
        rank: i + 1,
        name: u.nickname || '低碳用户',
        pts: u.weekPoints || 0,
        days: u.totalDays || 0,
        avatar: '🌿',
        isMe: u.openid === OPENID,
      }));
    } catch (e) {
      console.warn('[getLeaderboard] weekPoints 查询失败，回退到 actions 扫描:', e.message);
      const weekRes = await db
        .collection('actions')
        .where({ date: db.command.gte(start).and(db.command.lte(end)) })
        .field({ openid: true, points: true })
        .get();
      const weekMap = {};
      weekRes.data.forEach((a) => {
        if (!weekMap[a.openid]) weekMap[a.openid] = 0;
        weekMap[a.openid] += a.points || 0;
      });
      const weekOpenids = Object.keys(weekMap);
      if (weekOpenids.length > 0) {
        const usersRes = await db
          .collection('users')
          .where({ openid: db.command.in(weekOpenids) })
          .field({ openid: true, nickname: true, totalDays: true })
          .get();
        const userMap = {};
        usersRes.data.forEach((u) => {
          userMap[u.openid] = u;
        });
        weekList = Object.entries(weekMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([oid, pts], i) => {
            const u = userMap[oid] || {};
            return {
              rank: i + 1,
              name: u.nickname || '低碳用户',
              pts,
              days: u.totalDays || 0,
              avatar: '🌿',
              isMe: oid === OPENID,
            };
          });
      }
    }

    const totalRes = await db.collection('users').orderBy('totalPoints', 'desc').limit(20).get();
    const totalList = totalRes.data.map((u, i) => ({
      rank: i + 1,
      name: u.nickname || '低碳用户',
      pts: u.totalPoints || 0,
      days: u.totalDays || 0,
      avatar: '🌿',
      isMe: u.openid === OPENID,
    }));

    const myWeekRank = weekList.find((w) => w.isMe);
    return {
      success: true,
      data: {
        weekList,
        totalList,
        myRank: myWeekRank ? myWeekRank.rank : null,
      },
    };
  } catch (err) {
    console.error('[getLeaderboard]', err);
    return { success: false, error: err.message };
  }
};
