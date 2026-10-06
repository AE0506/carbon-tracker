// utils/storage.js  v6.7 — 统一 localStorage key 管理
const { getToday } = require('./date');
const KEYS = {
  TODAY: 'ct_today_action',
  WEEK: 'ct_week_cache',
  LOGIN: 'ct_login_cache',
  ONBOARD: 'ct_onboarding_done',
  CHALLENGE: 'ct_challenge_',
  QUIZ: 'ct_quiz_',
  QUIZ_SCORE: 'ct_quiz_score_',
  FAVORITES: 'ct_favorites',
  REMINDER: 'ct_reminder_on',
};

function saveTodayAction(a) {
  const data = { ...a, date: getToday(), ts: Date.now() };
  try {
    wx.setStorageSync(KEYS.TODAY, data);
  } catch (e) {}
  return data;
}
function getTodayAction() {
  try {
    const c = wx.getStorageSync(KEYS.TODAY);
    if (!c || c.date !== getToday()) {
      wx.removeStorageSync(KEYS.TODAY);
      return null;
    }
    return c;
  } catch (e) {
    return null;
  }
}
function clearTodayAction() {
  try {
    wx.removeStorageSync(KEYS.TODAY);
  } catch (e) {}
}
function saveWeekCache(data) {
  try {
    wx.setStorageSync(KEYS.WEEK, { data, ts: Date.now(), month: getToday().slice(0, 7) });
  } catch (e) {}
}
function getWeekCache() {
  try {
    const c = wx.getStorageSync(KEYS.WEEK);
    if (!c) return null;
    if (c.month !== getToday().slice(0, 7)) return null;
    if (Date.now() - c.ts > 5 * 60 * 1000) return null;
    return c.data;
  } catch (e) {
    return null;
  }
}
function clearWeekCache() {
  try {
    wx.removeStorageSync(KEYS.WEEK);
  } catch (e) {}
}
function isOnboardingDone() {
  try {
    return !!wx.getStorageSync(KEYS.ONBOARD);
  } catch (e) {
    return false;
  }
}
function setOnboardingDone() {
  try {
    wx.setStorageSync(KEYS.ONBOARD, true);
  } catch (e) {}
}
function clearAll() {
  Object.values(KEYS).forEach((k) => {
    try {
      wx.removeStorageSync(k);
    } catch (e) {}
  });
}

// ─── 组合 key 工具函数 ──────────────────────────
function getChallengeKey(date) {
  return KEYS.CHALLENGE + date;
}
function getQuizKey(date, isScore) {
  return isScore ? KEYS.QUIZ_SCORE + date : KEYS.QUIZ + date;
}

module.exports = {
  getToday,
  saveTodayAction,
  getTodayAction,
  clearTodayAction,
  saveWeekCache,
  getWeekCache,
  clearWeekCache,
  isOnboardingDone,
  setOnboardingDone,
  clearAll,
  KEYS,
  getChallengeKey,
  getQuizKey,
};
