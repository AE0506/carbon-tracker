export const knowledgeBase = {
  carbonCalculation: {
    transport: {
      walking: { carbon: 0, unit: 'kg CO2/km', label: '步行', description: '零碳排放，最健康的出行方式' },
      cycling: { carbon: 0, unit: 'kg CO2/km', label: '骑行', description: '零碳排放，锻炼身体' },
      bus: { carbon: 0.08, unit: 'kg CO2/km', label: '公交', description: '多人同行，碳排放较低' },
      subway: { carbon: 0.05, unit: 'kg CO2/km', label: '地铁', description: '电力驱动，碳排放较低' },
      taxi: { carbon: 0.18, unit: 'kg CO2/km', label: '出租车', description: '空车率高等因素，碳排放较高' },
      car: { carbon: 0.21, unit: 'kg CO2/km', label: '私家车', description: '单人行驶碳排放最高' },
    },
    diet: {
      vegetarian: { carbon: 1.5, unit: 'kg CO2/天', label: '素食', description: '碳排放最低的饮食方式' },
      normal: { carbon: 3.5, unit: 'kg CO2/天', label: '普通', description: '适量肉食，均衡饮食' },
      highCarbon: { carbon: 7.0, unit: 'kg CO2/天', label: '高碳', description: '大量肉食，碳排放较高' },
    },
    living: {
      home: { carbon: 2.0, unit: 'kg CO2/天', label: '在家', description: '基础能耗' },
      traveling: { carbon: 4.0, unit: 'kg CO2/天', label: '出行', description: '增加交通能耗' },
    },
  },
  lowCarbonTips: [
    '尽量选择步行或骑行出行，既环保又健康',
    '公共交通比私家车碳排放低80%',
    '素食一天的碳排放比肉食低50%',
    '购物时自备环保袋，减少塑料使用',
    '随手关灯拔插头，节约用电',
    '减少一次性餐具使用',
    '选择本地食材，减少运输碳排放',
    '衣服少洗一次，节约水和电',
    '空调温度调高一度，节约能源',
    '拼车出行，减少车辆数量',
  ],
  environmentalKnowledge: [
    {
      title: '什么是碳达峰？',
      content: '碳达峰是指某个地区或行业的碳排放量达到最高值后，不再增长而是逐步回落的过程。中国承诺2030年前实现碳达峰。',
    },
    {
      title: '什么是碳中和？',
      content: '碳中和是指通过植树造林、节能减排等形式，抵消自身产生的二氧化碳排放，达到相对零排放。中国承诺2060年前实现碳中和。',
    },
    {
      title: '森林碳汇的作用',
      content: '森林通过光合作用吸收大气中的二氧化碳，每公顷森林每年可吸收15-25吨二氧化碳，是重要的碳汇资源。',
    },
    {
      title: '个人如何减少碳足迹？',
      content: '从出行、饮食、居住三个方面入手：多使用公共交通和骑行、素食为主的生活方式、提高能效减少浪费。',
    },
    {
      title: '什么是低碳生活？',
      content: '低碳生活是一种节约资源、减少污染、保护环境的生产和生活方式核心理念是以较低的消费水平满足生活需求。',
    },
    {
      title: '碳排放的全球影响',
      content: '全球约71%的碳排放来自能源燃烧，减少化石燃料使用是应对气候变化的关键。每个人减少碳排放都有重要意义。',
    },
  ],
  quickQuestions: [
    '今天出行怎么碳排放最低？',
    '素食真的更环保吗？',
    '什么是碳达峰和碳中和？',
    '如何计算我的碳足迹？',
    '骑行的碳排放是多少？',
    '为什么森林很重要？',
  ],
}

export function searchKnowledge(query: string): string[] {
  const results: string[] = []
  const lowerQuery = query.toLowerCase()

  knowledgeBase.lowCarbonTips.forEach(tip => {
    if (tip.toLowerCase().includes(lowerQuery)) {
      results.push(tip)
    }
  })

  knowledgeBase.environmentalKnowledge.forEach(item => {
    if (item.title.toLowerCase().includes(lowerQuery) || item.content.toLowerCase().includes(lowerQuery)) {
      results.push(`${item.title}：${item.content}`)
    }
  })

  if (results.length === 0) {
    results.push('抱歉，我没有找到相关的知识。让我为你提供一些通用的低碳生活建议：')
    results.push(...knowledgeBase.lowCarbonTips.slice(0, 3))
  }

  return results
}

export function generateAIResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes('碳足迹') || lowerMessage.includes('计算')) {
    return `根据碳迹绿行的计算方法，碳足迹主要由以下三部分组成：

🚗 **交通出行**
- 步行/骑行：0 kg CO₂/km
- 地铁：0.05 kg CO₂/km
- 公交：0.08 kg CO₂/km
- 私家车：0.21 kg CO₂/km

🍽️ **饮食习惯**
- 素食：1.5 kg CO₂/天
- 普通：3.5 kg CO₂/天
- 高碳：7.0 kg CO₂/天

🏠 **生活状态**
- 在家：2.0 kg CO₂/天
- 出行：4.0 kg CO₂/天

建议选择步行、骑行或公共交通出行，减少私家车使用，可以显著降低碳足迹！`
  }

  if (lowerMessage.includes('低碳') || lowerMessage.includes('建议')) {
    return `🌿 **低碳生活建议**：

${knowledgeBase.lowCarbonTips.map(tip => `• ${tip}`).join('\n')}

坚持这些习惯，你的碳足迹会越来越小！`
  }

  if (lowerMessage.includes('碳中和') || lowerMessage.includes('碳达峰')) {
    return `📚 **碳中和与碳达峰**：

**碳达峰**：指碳排放量达到峰值后不再增长，开始下降。中国目标2030年前实现。

**碳中和**：通过植树造林、节能减排等方式抵消自身产生的二氧化碳排放。中国目标2060年前实现。

个人行动汇聚起来，就是实现这些目标的关键力量！`
  }

  if (lowerMessage.includes('森林') || lowerMessage.includes('树')) {
    return `🌳 **森林碳汇**：

森林是地球最大的碳汇之一：
• 每公顷森林每年吸收15-25吨二氧化碳
• 树木通过光合作用将二氧化碳转化为氧气和生物质
• 破坏森林会释放大量储存的碳，加剧全球变暖

在碳迹绿行中，你可以通过积累碳积分来种植虚拟树木，为地球增添绿意！`
  }

  return `🤖 你好！我是碳迹绿行 AI 助手。

我可以帮你：
• 解答碳足迹计算问题
• 提供低碳生活建议
• 科普环保知识

有什么关于低碳生活或环保的问题，随时问我！`
}