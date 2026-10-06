// getForest v6.7 — 树类型计数直接从 users 表读取，统一响应格式
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const CO2_PER_TREE = { giant: 1.5, medium: 1.0, small: 0.5, seedling: 0.2 };

/**
 * 获取用户森林数据：树列表 + 树种统计（优先 users 表读计数，回退到聚合查询）+ CO2 减排量
 * @param {object} event - 云函数调用参数，可选 limit/offset 分页
 * @param {object} context - 微信云调用上下文
 * @returns {Promise<{success: boolean, data?: {trees: object[], stats: object}, error?: string}>}
 */
exports.main = async (event, _context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '鉴权失败' };
  const { limit = 90, offset = 0 } = event;

  try {
    const tRes = await db
      .collection('trees')
      .where({ openid: OPENID })
      .orderBy('date', 'desc')
      .skip(offset)
      .limit(limit)
      .get();

    const uRes = await db
      .collection('users')
      .where({ openid: OPENID })
      .field({
        totalTrees: true,
        giantTreeCount: true,
        mediumTreeCount: true,
        smallTreeCount: true,
        seedlingTreeCount: true,
        lowCarbonCount: true,
        walkCount: true,
        veganCount: true,
      })
      .get();
    const user = uRes.data[0] || {};

    const trees = tRes.data;
    const cnt = { seedling: 0, small: 0, medium: 0, giant: 0 };

    const hasTreeCountFields =
      user.seedlingTreeCount !== undefined && user.smallTreeCount !== undefined && user.mediumTreeCount !== undefined;

    if (hasTreeCountFields) {
      cnt.seedling = user.seedlingTreeCount || 0;
      cnt.small = user.smallTreeCount || 0;
      cnt.medium = user.mediumTreeCount || 0;
      cnt.giant = user.giantTreeCount || 0;
    } else if ((user.totalTrees || 0) <= limit && offset === 0) {
      trees.forEach((t) => {
        if (cnt[t.treeType] !== undefined) cnt[t.treeType]++;
      });
    } else {
      try {
        const aggRes = await db
          .collection('trees')
          .aggregate()
          .match({ openid: OPENID })
          .group({ _id: '$treeType', count: { $sum: 1 } })
          .end();
        aggRes.list.forEach((g) => {
          cnt[g._id] = g.count;
        });
      } catch (e) {
        trees.forEach((t) => {
          if (cnt[t.treeType] !== undefined) cnt[t.treeType]++;
        });
      }
    }

    const co2 = Math.round(
      cnt.giant * CO2_PER_TREE.giant +
        cnt.medium * CO2_PER_TREE.medium +
        cnt.small * CO2_PER_TREE.small +
        cnt.seedling * CO2_PER_TREE.seedling
    );

    return {
      success: true,
      data: {
        trees,
        stats: {
          totalTrees: user.totalTrees || trees.length,
          giantCount: cnt.giant,
          mediumCount: cnt.medium,
          smallCount: cnt.small,
          seedlingCount: cnt.seedling,
          co2Saved: co2,
        },
      },
    };
  } catch (err) {
    console.error('[getForest]', err);
    return { success: false, error: err.message };
  }
};
