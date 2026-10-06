// login v6.7 — 频率限制 + 统一响应格式
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const LOGIN_COOLDOWN_MS = 2000;

function toUserInfo(user) {
  return {
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    level: user.level,
    totalPoints: user.totalPoints || 0,
    totalDays: user.totalDays || 0,
    totalTrees: user.totalTrees || 0,
    lowCarbonCount: user.lowCarbonCount || 0,
    walkCount: user.walkCount || 0,
    veganCount: user.veganCount || 0,
    giantTreeCount: user.giantTreeCount || 0,
    seedlingTreeCount: user.seedlingTreeCount || 0,
    smallTreeCount: user.smallTreeCount || 0,
    mediumTreeCount: user.mediumTreeCount || 0,
    streak: user.streak || 0,
    maxStreak: user.maxStreak || 0,
    lastRecordDate: user.lastRecordDate,
    unlockedBadges: user.unlockedBadges || [],
    weekPoints: user.weekPoints || 0,
    weekPointsStart: user.weekPointsStart || '',
  };
}

/**
 * 用户登录/注册云函数 — 查询或创建用户，含频率限制（2s冷却期内返回缓存信息）
 * @param {object} event - 云函数调用参数（无必传字段，可传入空对象）
 * @param {object} context - 微信云调用上下文
 * @returns {Promise<{success: boolean, data?: {openid: string, userInfo: object}, error?: string}>}
 */
exports.main = async (_event, _context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '鉴权失败' };

  const col = db.collection('users');
  try {
    const exist = await col.where({ openid: OPENID }).get();

    if (exist.data.length === 0) {
      const now = db.serverDate();
      const nu = {
        openid: OPENID,
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
        unlockedBadges: [],
        weekPoints: 0,
        weekPointsStart: '',
        lastRecomputeDate: '',
        lastLoginAttempt: 0,
        createTime: now,
        updateTime: now,
        lastLoginTime: now,
      };
      const r = await col.add({ data: nu });
      const doc = { _id: r._id, ...nu };
      return {
        success: true,
        data: {
          openid: OPENID,
          userInfo: toUserInfo(doc),
        },
      };
    }

    const user = exist.data[0];
    const now = Date.now();
    const lastAttempt = user.lastLoginAttempt || 0;
    const elapsed = now - lastAttempt;

    if (lastAttempt > 0 && elapsed < LOGIN_COOLDOWN_MS) {
      return {
        success: true,
        data: {
          openid: OPENID,
          userInfo: toUserInfo(user),
        },
      };
    }

    await col.doc(user._id).update({
      data: {
        lastLoginTime: db.serverDate(),
        lastLoginAttempt: now,
      },
    });

    return {
      success: true,
      data: {
        openid: OPENID,
        userInfo: toUserInfo(user),
      },
    };
  } catch (err) {
    console.error('[login]', err);
    return { success: false, error: err.message };
  }
};
