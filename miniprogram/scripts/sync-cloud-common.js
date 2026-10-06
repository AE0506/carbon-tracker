const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'cloudfunctions', 'common', 'index.js');
const consumers = ['deleteAction', 'getLeaderboard', 'getMonthHistory', 'getWeekStats', 'saveAction'];

for (const name of consumers) {
  const target = path.join(root, 'cloudfunctions', name, 'common.js');
  fs.copyFileSync(source, target);
}

console.log(`Synced cloudfunctions/common to ${consumers.length} cloud functions.`);
