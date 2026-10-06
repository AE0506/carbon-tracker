// data/record-options.js  打卡记录页 — 出行/饮食/状态选项
const transportOpts = [
  { key: 'walk', label: '步行', icon: '🚶', scoreLabel: '最低碳' },
  { key: 'bus', label: '公交/地铁', icon: '🚌', scoreLabel: '+1分' },
  { key: 'taxi', label: '打车', icon: '🚕', scoreLabel: '+3分' },
  { key: 'car', label: '自驾', icon: '🚗', scoreLabel: '+4分' },
];

const dietOpts = [
  { key: 'vegan', label: '素食', icon: '🥗', scoreLabel: '最低碳', span: false },
  { key: 'normal', label: '普通饮食', icon: '🍱', scoreLabel: '+2分', span: false },
  { key: 'high_carbon', label: '高碳饮食', icon: '🥩', scoreLabel: '+4分（牛肉/烧烤）', span: true },
];

const statusOpts = [
  { key: 'home', label: '居家', icon: '🏡', scoreLabel: '+1分' },
  { key: 'outside', label: '外出活动', icon: '🏙️', scoreLabel: '+2分' },
];

module.exports = { transportOpts, dietOpts, statusOpts };
