// ═══ 碳迹评分算法唯一真理源 ═══
// 本文件是 carbon-score 算法的权威定义。
// 小程序端 utils/carbonScore.js 需与此文件保持同步。
// 任何算法变更必须先改此文件，再同步到前端。
// @carbon-score-version: 2.0 — 修改时同步更新 utils/carbonScore.js
// cloudfunctions/common/index.js — 云函数共享模块

// ─── 日期工具 ────────────────────────────────────

/**
 * 获取今日日期字符串
 * @returns {string} YYYY-MM-DD
 */
function getToday() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * 获取昨日日期字符串
 * @param {string} today - YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
function getYesterday(today) {
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * 获取指定日期所在周的周一
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
function getWeekMonday(dateStr) {
  const d = new Date(dateStr);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * 校验日期格式 YYYY-MM-DD
 * @param {string} str
 * @returns {boolean}
 */
function isValidDate(str) {
  if (typeof str !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * 获取本周七天的日期数组（周一到周日）
 * @returns {string[]} YYYY-MM-DD[]
 */
function getWeekDates() {
  const now = new Date();
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow);
  mon.setHours(0, 0, 0, 0);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(d.getFullYear() + '-' + mm + '-' + dd);
  }
  return dates;
}

// ─── 评分系统 ────────────────────────────────────
const VALID_TRANSPORT = { walk: 0, bike: 0, bus: 1, taxi: 3, car: 4 };
const VALID_DIET = { vegan: 0, normal: 2, high_carbon: 4 };
const VALID_STATUS = { home: 1, outside: 2 };
const MAX_SCORE = 10;

/**
 * 计算碳迹评分（0-10，越低越低碳）
 * @param {string} t - 出行方式: walk|bike|bus|taxi|car
 * @param {string} d - 饮食方式: vegan|normal|high_carbon
 * @param {string} s - 生活状态: home|outside
 * @returns {number} 0-10
 */
function calcScore(t, d, s) {
  let sc = VALID_TRANSPORT[t] + VALID_DIET[d] + VALID_STATUS[s];
  if (t === 'car' && d === 'high_carbon') sc++;
  if (t === 'walk' && d === 'vegan') sc--;
  return Math.max(0, Math.min(MAX_SCORE, sc));
}

/**
 * 根据评分计算树木成长值（10 - 评分）
 * @param {number} sc - 碳迹评分
 * @returns {number} 0-10
 */
function calcTreeValue(sc) {
  return Math.max(0, MAX_SCORE - sc);
}

/**
 * 根据树木成长值获取树类型
 * @param {number} tv - 树木成长值
 * @returns {{type: string, level: number, label: string}}
 */
function getTreeType(tv) {
  if (tv <= 2) return { type: 'seedling', level: 1, label: '小苗' };
  if (tv <= 5) return { type: 'small', level: 2, label: '小树' };
  if (tv <= 8) return { type: 'medium', level: 3, label: '大树' };
  return { type: 'giant', level: 4, label: '巨树' };
}

/**
 * 根据评分计算获得积分数
 * @param {number} sc - 碳迹评分
 * @returns {number} 1-10
 */
function calcPoints(sc) {
  return Math.max(1, 10 - sc);
}

// ─── 等级系统 ────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 30, 80, 150, 250, 400, 600, 900, 1300, 1800];

/**
 * 根据总积分计算用户等级（1-10）
 * @param {number} pts - 总积分
 * @returns {number} 1-10
 */
function calcLevel(pts) {
  let lv = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pts >= LEVEL_THRESHOLDS[i]) {
      lv = i + 1;
      break;
    }
  }
  return Math.min(lv, 10);
}

// ─── 成就触发器 ──────────────────────────────────
const TRIGGERS = [
  { id: 'first_record', check: (s) => s.totalDays >= 1 },
  { id: 'streak_3', check: (s) => s.streak >= 3 },
  { id: 'streak_7', check: (s) => s.streak >= 7 },
  { id: 'low_5', check: (s) => s.lowCarbonCount >= 5 },
  { id: 'walk_10', check: (s) => s.walkCount >= 10 },
  { id: 'vegan_5', check: (s) => s.veganCount >= 5 },
  { id: 'total_30', check: (s) => s.totalDays >= 30 },
  { id: 'level_5', check: (s) => s.level >= 5 },
  { id: 'giant_tree', check: (s) => s.giantTreeCount >= 1 },
];

// 树类型到 users 计数字段的映射
const TREE_COUNT_FIELD = {
  seedling: 'seedlingTreeCount',
  small: 'smallTreeCount',
  medium: 'mediumTreeCount',
  giant: 'giantTreeCount',
};

const CHALLENGE_POOL = [
  { id: 'walk_all', bonus: 5, check: (action) => action && action.transport === 'walk' },
  { id: 'vegan_day', bonus: 5, check: (action) => action && action.diet === 'vegan' },
  { id: 'bus_only', bonus: 3, check: (action) => action && action.transport === 'bus' },
  { id: 'home_day', bonus: 3, check: (action) => action && action.status === 'home' },
  {
    id: 'combo_eco',
    bonus: 8,
    check: (action) => action && action.transport === 'walk' && action.diet === 'vegan' && action.status === 'home',
  },
  { id: 'bike_go', bonus: 4, check: (action) => action && action.transport === 'walk' },
  { id: 'no_meat', bonus: 4, check: (action) => action && action.diet !== 'high_carbon' },
];

function getDailyChallenge(date) {
  let hash = 0;
  for (let i = 0; i < date.length; i++) hash = (hash * 31 + date.charCodeAt(i)) % CHALLENGE_POOL.length;
  return CHALLENGE_POOL[hash];
}

/**
 * 从 actions 集合全量重算用户统计数据（分页，上限1000条）
 * @param {object} db - 微信云数据库实例
 * @param {string} openid - 用户 openid
 * @returns {Promise<{totalDays: number, lowCarbonCount: number, walkCount: number, veganCount: number, giantTreeCount: number, seedlingTreeCount: number, smallTreeCount: number, mediumTreeCount: number, totalPoints: number, weekPoints: number, streak: number, level: number, lastRecordDate: string|null}>}
 */
async function recomputeUserStats(db, openid) {
  const PAGE_SIZE = 100;
  const MAX_RECORDS = 1000;
  let allActions = [];
  let skip = 0;
  while (skip < MAX_RECORDS) {
    const page = await db
      .collection('actions')
      .where({ openid })
      .orderBy('date', 'asc')
      .field({ date: true, score: true, transport: true, diet: true, treeType: true, points: true })
      .skip(skip)
      .limit(PAGE_SIZE)
      .get();
    if (page.data.length === 0) break;
    allActions = allActions.concat(page.data);
    skip += PAGE_SIZE;
  }
  if (skip >= MAX_RECORDS) {
    console.warn('[recomputeUserStats] 用户 ' + openid + ' 达到最大记录上限 ' + MAX_RECORDS + ' 条');
  }

  const records = allActions;
  const totalDays = records.length;
  let lowCarbonCount = 0,
    walkCount = 0,
    veganCount = 0,
    giantTreeCount = 0;
  let seedlingTreeCount = 0,
    smallTreeCount = 0,
    mediumTreeCount = 0;
  let totalPoints = 0,
    weekPoints = 0;

  const today = getToday();
  const weekMonday = getWeekMonday(today);

  records.forEach((r) => {
    if (r.score <= 3) lowCarbonCount++;
    if (r.transport === 'walk') walkCount++;
    if (r.diet === 'vegan') veganCount++;
    if (r.treeType === 'giant') giantTreeCount++;
    if (r.treeType === 'seedling') seedlingTreeCount++;
    if (r.treeType === 'small') smallTreeCount++;
    if (r.treeType === 'medium') mediumTreeCount++;
    totalPoints += r.points || 0;
    if (r.date >= weekMonday) weekPoints += r.points || 0;
  });

  const dates = records.map((r) => r.date).sort();
  let streak = 0;
  if (dates.length > 0) {
    const todayMs = new Date(today).getTime();
    let checkMs = todayMs;
    const dateSet = new Set(dates);
    while (true) {
      const ds = new Date(checkMs);
      const key =
        ds.getFullYear() +
        '-' +
        String(ds.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(ds.getDate()).padStart(2, '0');
      if (dateSet.has(key)) {
        streak++;
        checkMs -= 86400000;
      } else {
        break;
      }
    }
  }

  const lastRecordDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const level = calcLevel(totalPoints);

  return {
    totalDays,
    lowCarbonCount,
    walkCount,
    veganCount,
    giantTreeCount,
    seedlingTreeCount,
    smallTreeCount,
    mediumTreeCount,
    totalPoints,
    weekPoints,
    streak,
    level,
    lastRecordDate,
  };
}

/**
 * 增量更新用户统计数据（纯函数，可独立测试）
 * @param {object} user - 当前用户数据
 * @param {object} action - 本次记录 {score, points, transport, diet, treeType}
 * @param {boolean} isUpdate - 是否为更新（而非新增）
 * @param {object|null} oldAction - 更新前的旧记录
 * @returns {{totalPoints: number, totalDays: number, lowCarbonCount: number, walkCount: number, veganCount: number, giantTreeCount: number, seedlingTreeCount: number, smallTreeCount: number, mediumTreeCount: number, streak: number, weekPoints: number, level: number, weekPointsStart: string}}
 */
function calcIncrementalUpdate(user, action, isUpdate, oldAction) {
  const today = getToday();
  const yesterday = getYesterday(today);
  const weekMonday = getWeekMonday(today);

  const pointsDelta = isUpdate ? action.points - (oldAction.points || 0) : action.points;
  const totalPoints = Math.max(0, (user.totalPoints || 0) + pointsDelta);
  const totalDays = isUpdate ? user.totalDays || 0 : (user.totalDays || 0) + 1;

  const getDelta = (condOld, condNew) => {
    if (!isUpdate) return condNew ? 1 : 0;
    return (condNew ? 1 : 0) - (condOld ? 1 : 0);
  };

  const lowCarbonDelta = getDelta(oldAction && oldAction.score <= 3, action.score <= 3);
  const walkDelta = getDelta(oldAction && oldAction.transport === 'walk', action.transport === 'walk');
  const veganDelta = getDelta(oldAction && oldAction.diet === 'vegan', action.diet === 'vegan');
  const giantTreeDelta = getDelta(oldAction && oldAction.treeType === 'giant', action.treeType === 'giant');

  const treeTypeDeltas = {};
  Object.keys(TREE_COUNT_FIELD).forEach((tt) => {
    treeTypeDeltas[tt] = isUpdate
      ? (action.treeType === tt ? 1 : 0) - (oldAction && oldAction.treeType === tt ? 1 : 0)
      : action.treeType === tt
        ? 1
        : 0;
  });

  const lowCarbonCount = Math.max(0, (user.lowCarbonCount || 0) + lowCarbonDelta);
  const walkCount = Math.max(0, (user.walkCount || 0) + walkDelta);
  const veganCount = Math.max(0, (user.veganCount || 0) + veganDelta);
  const giantTreeCount = Math.max(0, (user.giantTreeCount || 0) + giantTreeDelta);
  const seedlingTreeCount = Math.max(0, (user.seedlingTreeCount || 0) + (treeTypeDeltas.seedling || 0));
  const smallTreeCount = Math.max(0, (user.smallTreeCount || 0) + (treeTypeDeltas.small || 0));
  const mediumTreeCount = Math.max(0, (user.mediumTreeCount || 0) + (treeTypeDeltas.medium || 0));

  let streak;
  if (!isUpdate) {
    streak = user.lastRecordDate === yesterday ? (user.streak || 0) + 1 : 1;
  } else {
    streak = user.streak || 0;
  }

  const userWeekStart = user.weekPointsStart || '';
  let weekPoints;
  if (userWeekStart !== weekMonday) {
    weekPoints = isUpdate ? (oldAction.points || 0) + pointsDelta : action.points;
  } else {
    weekPoints = Math.max(0, (user.weekPoints || 0) + pointsDelta);
  }

  const level = calcLevel(totalPoints);

  return {
    totalPoints,
    totalDays,
    lowCarbonCount,
    walkCount,
    veganCount,
    giantTreeCount,
    seedlingTreeCount,
    smallTreeCount,
    mediumTreeCount,
    streak,
    weekPoints,
    level,
    weekPointsStart: weekMonday,
  };
}

function shouldRecomputeStats(lastRecomputeDate, actionDate, today) {
  const currentDate = today || getToday();
  const daysSinceRecompute = lastRecomputeDate
    ? Math.floor((new Date(currentDate) - new Date(lastRecomputeDate)) / 86400000)
    : 999;
  return daysSinceRecompute > 7 || actionDate !== currentDate;
}

// ─── 前后端同步对照表 ──────────────────────────────
// common/index.js              →  utils/carbonScore.js
// ─────────────────────────────────────────────────
// VALID_TRANSPORT               →  TRANSPORT_MAP
// VALID_DIET                    →  DIET_MAP
// VALID_STATUS                  →  STATUS_MAP
// calcScore(t,d,s)              →  calculateScore({transport,diet,status})
// getTreeType(treeValue)        →  getTreeLevel(treeValue) / TREE_LEVELS
// calcPoints(score)             →  calcPointsEarned(score)
// LEVEL_THRESHOLDS              →  LV_LIST[].min
// calcLevel(pts)                →  getUserLevel(pts)
// TRIGGERS                      →  ALL_BADGES (utils/achievement.js)
// TREE_COUNT_FIELD              →  treeType → users 计数字段映射

module.exports = {
  getToday,
  getYesterday,
  getWeekMonday,
  isValidDate,
  getWeekDates,
  VALID_TRANSPORT,
  VALID_DIET,
  VALID_STATUS,
  MAX_SCORE,
  calcScore,
  calcTreeValue,
  getTreeType,
  calcPoints,
  LEVEL_THRESHOLDS,
  calcLevel,
  TRIGGERS,
  TREE_COUNT_FIELD,
  CHALLENGE_POOL,
  getDailyChallenge,
  recomputeUserStats,
  calcIncrementalUpdate,
  shouldRecomputeStats,
};
