const { getUserLevel } = require('./carbonScore');

const TREE_COUNT_FIELD = {
  seedling: 'seedlingTreeCount',
  small: 'smallTreeCount',
  medium: 'mediumTreeCount',
  giant: 'giantTreeCount',
};

function getWeekMonday(dateStr) {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function buildLocalUserPatch(userInfo, nextAction, oldAction) {
  const user = userInfo || {};
  const isUpdate = !!oldAction;
  const pointsDelta = isUpdate ? nextAction.pts - (oldAction.pts || 0) : nextAction.pts;
  const weekStart = getWeekMonday(nextAction.date);
  const baseWeekPoints = user.weekPointsStart === weekStart ? user.weekPoints || 0 : 0;
  const patch = {
    totalPoints: Math.max(0, (user.totalPoints || 0) + pointsDelta),
    weekPoints: Math.max(0, baseWeekPoints + pointsDelta),
    weekPointsStart: weekStart,
    totalTrees: isUpdate ? user.totalTrees || 0 : (user.totalTrees || 0) + 1,
    totalDays: isUpdate ? user.totalDays || 0 : (user.totalDays || 0) + 1,
    lowCarbonCount: Math.max(
      0,
      (user.lowCarbonCount || 0) + (nextAction.score <= 3 ? 1 : 0) - (isUpdate && oldAction.score <= 3 ? 1 : 0)
    ),
    walkCount: Math.max(
      0,
      (user.walkCount || 0) +
        (nextAction.transport === 'walk' ? 1 : 0) -
        (isUpdate && oldAction.transport === 'walk' ? 1 : 0)
    ),
    veganCount: Math.max(
      0,
      (user.veganCount || 0) + (nextAction.diet === 'vegan' ? 1 : 0) - (isUpdate && oldAction.diet === 'vegan' ? 1 : 0)
    ),
    lastRecordDate: nextAction.date,
  };

  Object.keys(TREE_COUNT_FIELD).forEach((type) => {
    const field = TREE_COUNT_FIELD[type];
    patch[field] = Math.max(
      0,
      (user[field] || 0) + (nextAction.treeType === type ? 1 : 0) - (isUpdate && oldAction.treeType === type ? 1 : 0)
    );
  });
  patch.level = getUserLevel(patch.totalPoints).lv;
  return patch;
}

function buildLocalDeletePatch(userInfo, oldAction) {
  const user = userInfo || {};
  if (!oldAction) return {};
  const weekStart = getWeekMonday(oldAction.date);
  const baseWeekPoints = user.weekPointsStart === weekStart ? user.weekPoints || 0 : 0;
  const patch = {
    totalPoints: Math.max(0, (user.totalPoints || 0) - (oldAction.pts || 0)),
    weekPoints: Math.max(0, baseWeekPoints - (oldAction.pts || 0)),
    weekPointsStart: weekStart,
    totalTrees: Math.max(0, (user.totalTrees || 0) - 1),
    totalDays: Math.max(0, (user.totalDays || 0) - 1),
    lowCarbonCount: Math.max(0, (user.lowCarbonCount || 0) - (oldAction.score <= 3 ? 1 : 0)),
    walkCount: Math.max(0, (user.walkCount || 0) - (oldAction.transport === 'walk' ? 1 : 0)),
    veganCount: Math.max(0, (user.veganCount || 0) - (oldAction.diet === 'vegan' ? 1 : 0)),
    lastRecordDate: null,
  };
  Object.keys(TREE_COUNT_FIELD).forEach((type) => {
    const field = TREE_COUNT_FIELD[type];
    patch[field] = Math.max(0, (user[field] || 0) - (oldAction.treeType === type ? 1 : 0));
  });
  patch.level = getUserLevel(patch.totalPoints).lv;
  return patch;
}

module.exports = { buildLocalUserPatch, buildLocalDeletePatch };
