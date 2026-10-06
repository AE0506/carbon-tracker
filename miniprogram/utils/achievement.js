// utils/achievement.js
const ALL_BADGES = [
  { id: 'first_record', name: '初次打卡', icon: '🌱', desc: '完成第一次记录', check: (s) => s.totalDays >= 1 },
  { id: 'streak_3', name: '低碳先锋', icon: '🔥', desc: '连续打卡 3 天', check: (s) => s.streak >= 3 },
  { id: 'streak_7', name: '绿色坚持者', icon: '💪', desc: '连续打卡 7 天', check: (s) => s.streak >= 7 },
  { id: 'low_5', name: '低碳达人', icon: '🏅', desc: '累计 5 次低碳', check: (s) => s.lowCarbonCount >= 5 },
  { id: 'walk_10', name: '步行健将', icon: '🚶', desc: '步行记录 10 次', check: (s) => s.walkCount >= 10 },
  { id: 'vegan_5', name: '素食之星', icon: '🥗', desc: '素食记录 5 次', check: (s) => s.veganCount >= 5 },
  { id: 'total_30', name: '铁杆记录者', icon: '📅', desc: '累计打卡 30 天', check: (s) => s.totalDays >= 30 },
  { id: 'giant_tree', name: '巨树种植者', icon: '🌲', desc: '种出一棵巨树', check: (s) => s.giantTreeCount >= 1 },
  { id: 'level_5', name: '低碳大师', icon: '⭐', desc: '升至 Lv.5 低碳达人', check: (s) => s.level >= 5 },
];
function checkNewAchievements(stats, unlockedIds = []) {
  return ALL_BADGES.filter((b) => !unlockedIds.includes(b.id) && b.check(stats));
}
function getBadgeList(unlockedIds = []) {
  return ALL_BADGES.map((b) => ({ ...b, unlocked: unlockedIds.includes(b.id) }));
}
module.exports = { ALL_BADGES, checkNewAchievements, getBadgeList };
