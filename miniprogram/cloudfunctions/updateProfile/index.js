// updateProfile v6.7 — 服务端输入校验，统一响应格式
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function validateNickname(val) {
  if (typeof val !== 'string') return '昵称必须为字符串';
  const trimmed = val.trim();
  if (trimmed.length === 0) return '昵称不能为空';
  if (trimmed.length < 1 || trimmed.length > 20) return '昵称长度需在 1-20 个字符之间';
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return '昵称包含非法控制字符';
  if (/[<>{}[\]()*&^%$#@!~`\\|;:'",?/=]/.test(trimmed)) return '昵称包含不允许的特殊字符';
  return null;
}

function validateAvatarUrl(val) {
  if (typeof val !== 'string') return '头像地址必须为字符串';
  if (val === '') return null;
  if (!val.startsWith('cloud://') && !val.startsWith('https://')) {
    return '头像地址需为 cloud:// 或 https:// 格式';
  }
  if (val.length > 500) return '头像地址过长';
  return null;
}

/**
 * 更新用户昵称/头像，服务端校验格式（昵称长度与字符过滤，头像 URL 协议检查）
 * @param {object} event - 云函数调用参数，可选 nickname/avatarUrl 字段
 * @param {object} context - 微信云调用上下文
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
exports.main = async (event, _context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '鉴权失败' };

  const allowed = ['nickname', 'avatarUrl'];
  const update = {};

  allowed.forEach((k) => {
    if (event[k] !== undefined) update[k] = event[k];
  });

  if (!Object.keys(update).length) return { success: false, error: '无有效字段' };

  if (update.nickname !== undefined) {
    const err = validateNickname(update.nickname);
    if (err) return { success: false, error: err };
    update.nickname = update.nickname.trim();
  }

  if (update.avatarUrl !== undefined) {
    const err = validateAvatarUrl(update.avatarUrl);
    if (err) return { success: false, error: err };
  }

  update.updateTime = db.serverDate();

  try {
    await db.collection('users').where({ openid: OPENID }).update({ data: update });
    return { success: true, data: {} };
  } catch (err) {
    console.error('[updateProfile]', err);
    return { success: false, error: err.message };
  }
};
