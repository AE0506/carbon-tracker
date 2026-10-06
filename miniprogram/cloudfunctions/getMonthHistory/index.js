// getMonthHistory v6.7 — 使用 common 共享模块，统一响应格式
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const { isValidDate } = require('./common.js');

/**
 * 按月查询用户碳迹历史记录（actions 表），支持日期范围过滤，最多返回31条
 * @param {object} event - 云函数调用参数，含 startDate/endDate（YYYY-MM-DD 格式）
 * @param {object} context - 微信云调用上下文
 * @returns {Promise<{success: boolean, data?: {records: object[]}, error?: string}>}
 */
exports.main = async (event, _context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '鉴权失败' };

  const { startDate, endDate } = event;

  if (!startDate || !endDate) {
    return { success: false, error: '缺少 startDate/endDate 参数' };
  }
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return { success: false, error: '日期格式错误，需为 YYYY-MM-DD' };
  }
  if (startDate > endDate) {
    return { success: false, error: 'startDate 不能大于 endDate' };
  }

  try {
    const res = await db
      .collection('actions')
      .where({
        openid: OPENID,
        date: db.command.gte(startDate).and(db.command.lte(endDate)),
      })
      .orderBy('date', 'desc')
      .limit(31)
      .get();
    return { success: true, data: { records: res.data } };
  } catch (err) {
    console.error('[getMonthHistory]', err);
    return { success: false, error: err.message };
  }
};
