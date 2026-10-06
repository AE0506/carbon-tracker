// @carbon-score-version: 2.0 — 修改时同步更新 cloudfunctions/common/index.js
// utils/carbonScore.js
const TRANSPORT_MAP = { walk: 0, bike: 0, bus: 1, taxi: 3, car: 4 };
const DIET_MAP = { vegan: 0, normal: 2, high_carbon: 4 };
const STATUS_MAP = { home: 1, outside: 2 };
const MAX_SCORE = 10;
const TREE_LEVELS = [
  { level: 1, min: 0, max: 2, type: 'seedling', label: '小苗', size: 'sm' },
  { level: 2, min: 3, max: 5, type: 'small', label: '小树', size: 'md' },
  { level: 3, min: 6, max: 8, type: 'medium', label: '大树', size: 'lg' },
  { level: 4, min: 9, max: 99, type: 'giant', label: '巨树', size: 'xl' },
];
const LV_LIST = [
  { lv: 1, name: '新手探索者', title: '刚开始关注环保', min: 0, next: 30 },
  { lv: 2, name: '低碳新人', title: '开始低碳生活', min: 30, next: 80 },
  { lv: 3, name: '低碳学徒', title: '低碳习惯养成中', min: 80, next: 150 },
  { lv: 4, name: '低碳使者', title: '积极践行环保', min: 150, next: 250 },
  { lv: 5, name: '低碳达人', title: '生活处处低碳', min: 250, next: 400 },
  { lv: 6, name: '绿色先锋', title: '带动身边人', min: 400, next: 600 },
  { lv: 7, name: '环保卫士', title: '坚持不懈的践行者', min: 600, next: 900 },
  { lv: 8, name: '地球守护者', title: '模范环保达人', min: 900, next: 1300 },
  { lv: 9, name: '生态领袖', title: '引领绿色生活', min: 1300, next: 1800 },
  { lv: 10, name: '地球英雄', title: '满级守护者', min: 1800, next: 9999 },
];
const GRADES = [
  { max: 3, level: 'low', label: '低碳', color: '#1a7a4a' },
  { max: 6, level: 'med', label: '一般', color: '#f0a500' },
  { max: 99, level: 'high', label: '偏高', color: '#e05c3a' },
];
const FEEDBACKS = {
  low: [
    { msg: '今天表现很好，为地球加油了 🌱', sug: '继续保持，你是最棒的！' },
    { msg: '超级低碳！今天你真的很棒 🌿', sug: '明天也一样，加油！' },
    { msg: '今日碳排极低，做到了！🍃', sug: '继续你的低碳之旅～' },
  ],
  med: [
    { msg: '还不错，可以更低碳一点哦 👀', sug: '试试多步行，或换乘公交' },
    { msg: '一般水平，明天更努力 💪', sug: '素食一天也很有帮助哦' },
  ],
  high: [
    { msg: '今天碳排偏高，没关系的 💚', sug: '明天试试公交或步行吧' },
    { msg: '偶尔偏高没关系，坚持就好 🤗', sug: '低碳饮食也是个好方向' },
  ],
};
function calculateScore(a) {
  let s = (TRANSPORT_MAP[a.transport] || 0) + (DIET_MAP[a.diet] || 0) + (STATUS_MAP[a.status] || 0);
  if (a.transport === 'car' && a.diet === 'high_carbon') s++;
  if (a.transport === 'walk' && a.diet === 'vegan') s--;
  return Math.max(0, Math.min(MAX_SCORE, s));
}
function getGrade(score) {
  return GRADES.find((g) => score <= g.max) || GRADES[GRADES.length - 1];
}
function generateFeedback(score) {
  const g = getGrade(score);
  const p = FEEDBACKS[g.level] || FEEDBACKS.high;
  return p[Math.floor(Math.random() * p.length)];
}
function calcTreeValue(score) {
  return Math.max(0, MAX_SCORE - score);
}
function getTreeLevel(tv) {
  return TREE_LEVELS.find((l) => tv >= l.min && tv <= l.max) || TREE_LEVELS[0];
}
function getTreeInfo(score) {
  const tv = calcTreeValue(score);
  return { treeValue: tv, ...getTreeLevel(tv) };
}
function calcPointsEarned(score) {
  return Math.max(1, 10 - score);
}
function getUserLevel(pts) {
  for (let i = LV_LIST.length - 1; i >= 0; i--) {
    if (pts >= LV_LIST[i].min) return LV_LIST[i];
  }
  return LV_LIST[0];
}
function getLevelProgress(pts) {
  const cur = getUserLevel(pts);
  const next = LV_LIST.find((l) => l.lv === cur.lv + 1) || cur;
  const range = next.min - cur.min,
    prog = pts - cur.min;
  const pct = range > 0 ? Math.min(100, Math.round((prog / range) * 100)) : 100;
  return { pct, current: pts, next: next.min, remaining: Math.max(0, next.min - pts), lvInfo: cur, nextLvInfo: next };
}
module.exports = {
  TRANSPORT_MAP,
  DIET_MAP,
  STATUS_MAP,
  MAX_SCORE,
  TREE_LEVELS,
  LV_LIST,
  GRADES,
  calculateScore,
  getGrade,
  generateFeedback,
  calcTreeValue,
  getTreeLevel,
  getTreeInfo,
  calcPointsEarned,
  getUserLevel,
  getLevelProgress,
};
