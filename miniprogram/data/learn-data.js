// data/learn-data.js  低碳知识学院 — 文章列表 & 题库
const ARTICLE_LIST = [
  {
    id: 'transport',
    icon: '🚗',
    title: '交通碳排放对比',
    subtitle: '不同出行方式的碳足迹差异',
    color: '#4a7fd4',
    bg: '#e8f0ff',
    sections: [
      { type: 'text', content: '你知道吗？不同出行方式的碳排放差异巨大！' },
      {
        type: 'compare',
        data: [
          { way: '步行', emission: '0', icon: '🚶', benefit: '零碳排放，还能锻炼身体' },
          { way: '骑行', emission: '0', icon: '🚲', benefit: '零碳排放，城市通勤首选' },
          { way: '公交/地铁', emission: '65-82g/km', icon: '🚌', benefit: '多人合乘，人均碳排低' },
          { way: '打车', emission: '150g/km', icon: '🚕', benefit: '空驶率高，碳排放较高' },
          { way: '自驾', emission: '220g/km', icon: '🚗', benefit: '单人驾乘，碳排放最高' },
        ],
      },
      { type: 'tip', content: '每周少开一天车，全年可减少约2.3吨CO₂排放！' },
    ],
  },
  {
    id: 'diet',
    icon: '🥗',
    title: '饮食与碳足迹',
    subtitle: '你吃的食物碳排放知多少',
    color: '#2d9e65',
    bg: '#e8f5ee',
    sections: [
      { type: 'text', content: '饮食是个人碳足迹的重要组成部分！' },
      {
        type: 'compare',
        data: [
          { way: '纯素食', emission: '极低', icon: '🥗', benefit: '植物性饮食碳排放最低' },
          { way: '普通饮食', emission: '中等', icon: '🍱', benefit: '适量肉类摄入' },
          { way: '高碳饮食', emission: '高', icon: '🥩', benefit: '牛肉/烧烤碳排放很高' },
        ],
      },
      { type: 'fact', content: '生产1kg牛肉约产生27kg CO₂，是同等重量蔬菜的50倍！' },
      { type: 'tip', content: '"周一吃素"是一个很好的开始，每周一天素食可减少约15%的饮食碳足迹。' },
    ],
  },
  {
    id: 'home',
    icon: '🏠',
    title: '居家节能指南',
    subtitle: '家庭生活中的低碳小技巧',
    color: '#f0a500',
    bg: '#fff8e8',
    sections: [
      { type: 'text', content: '居家生活也有很多低碳好习惯！' },
      {
        type: 'tips',
        data: [
          { title: '随手关灯', detail: '离开房间时关闭灯具，LED灯比白炽灯节能80%' },
          { title: '调节空调', detail: '夏季制冷设置26°C，每调高1°C可省电6%' },
          { title: '节约用水', detail: '短时间淋浴比泡澡节省约70%的用水和能源' },
          { title: '冰箱节能', detail: '冰箱装满约80%最省电，避免频繁开关门' },
          { title: '拔掉插头', detail: '电器待机耗电占家庭用电5-10%，不用时拔掉插头' },
        ],
      },
      { type: 'tip', content: '养成良好习惯，每月电费可节省20-30%！' },
    ],
  },
  {
    id: 'weekly',
    icon: '📅',
    title: '每周低碳挑战',
    subtitle: '系统推荐的主题减碳行动',
    color: '#9b59b6',
    bg: '#f3e8ff',
    sections: [
      { type: 'text', content: '每周一个主题，养成低碳好习惯！' },
      {
        type: 'challenge',
        data: [
          { week: '第1周', theme: '无肉周一', desc: '每周一选择素食，减少肉类摄入' },
          { week: '第2周', theme: '绿色出行周', desc: '尽量选择公共交通或骑行' },
          { week: '第3周', theme: '节能省电周', desc: '养成随手关灯、拔插头的好习惯' },
          { week: '第4周', theme: '减塑行动周', desc: '拒绝一次性塑料，使用环保袋' },
        ],
      },
      { type: 'tip', content: '坚持完成每周挑战，可额外获得500积分奖励！' },
    ],
  },
  {
    id: 'co2',
    icon: '🌍',
    title: '碳足迹基础知识',
    subtitle: '了解什么是碳足迹',
    color: '#1a7a4a',
    bg: '#e8f5ee',
    sections: [
      { type: 'text', content: '碳足迹是指一个人的活动直接和间接产生的二氧化碳排放量。' },
      { type: 'fact', content: '全球人均碳足迹约4吨/年，而中国人均约7吨/年。' },
      {
        type: 'compare',
        data: [
          { way: '全球平均', emission: '4吨CO₂/年', icon: '🌍', benefit: '' },
          { way: '中国平均', emission: '7吨CO₂/年', icon: '🇨🇳', benefit: '' },
          { way: '美国平均', emission: '16吨CO₂/年', icon: '🇺🇸', benefit: '' },
        ],
      },
      { type: 'tip', content: '如果每个人每天减少1kg碳排放，一年可减少365kg CO₂！' },
    ],
  },
];

const QUIZ_DATA = [
  {
    q: '以下哪种出行方式碳排放最低？',
    options: ['A. 步行', 'B. 打车', 'C. 自驾'],
    answer: 0,
    exp: '步行零碳排放，是最环保的出行方式！',
  },
  {
    q: '生产1kg牛肉约产生多少CO₂？',
    options: ['A. 5kg', 'B. 15kg', 'C. 27kg'],
    answer: 2,
    exp: '牛肉生产碳排放极高，是蔬菜的50倍！',
  },
  {
    q: '夏季空调制冷建议温度是多少？',
    options: ['A. 20°C', 'B. 24°C', 'C. 26°C'],
    answer: 2,
    exp: '26°C既舒适又节能，每调高1°C省电6%！',
  },
];

module.exports = { ARTICLE_LIST, QUIZ_DATA };
