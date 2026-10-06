// utils/date.js — 统一日期工具（前端+云函数共享逻辑）
// 云函数中通过内联相同逻辑使用（云函数独立部署，无法require前端utils）

function getToday() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function isValidDate(str) {
  if (typeof str !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

function getDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return getTodayLike(d);
}

function getTodayLike(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

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
    dates.push(getTodayLike(d));
  }
  return dates;
}

module.exports = { getToday, isValidDate, getDaysAgo, getTodayLike, getWeekDates };
