// getWeekStats v6.7 — 统一响应格式
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const { getWeekDates } = require('./common.js');

/**
 * 获取本周7天碳迹记录状态 — 查询周一至周日的 actions 记录，返回每天是否有记录及详情，标记当天
 * @param {object} event - 云函数调用参数（无必传字段）
 * @param {object} context - 微信云调用上下文
 * @returns {Promise<{success: boolean, data?: {weekData: Array<{date: string, scored: boolean}>}, error?: string}>}
 */
exports.main = async (_event, _context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '鉴权失败' };

  const weekDates = getWeekDates();
  const todayIdx = (new Date().getDay() + 6) % 7;
  const today = weekDates[todayIdx];

  try {
    const res = await db
      .collection('actions')
      .where({ openid: OPENID, date: db.command.in(weekDates) })
      .orderBy('date', 'asc')
      .get();
    const map = {};
    res.data.forEach((r) => {
      map[r.date] = r;
    });
    const weekData = weekDates.map((date) => {
      const r = map[date];
      if (r)
        return {
          date,
          scored: true,
          score: r.score,
          transport: r.transport,
          diet: r.diet,
          status: r.status,
          points: r.points,
          isToday: date === today,
        };
      return { date, scored: false, score: null, isToday: date === today };
    });
    return { success: true, data: { weekData } };
  } catch (err) {
    console.error('[getWeekStats]', err);
    return { success: false, error: err.message };
  }
};
