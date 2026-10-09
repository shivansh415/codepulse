const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const redis = require('../config/redisClient');

const getStats = async (req, res, next) => {
  try {
    const [userCount, syncOkCount, syncTotalCount, hits, misses] = await Promise.all([
      User.countDocuments(),
      PlatformStats.countDocuments({ syncStatus: 'ok' }),
      PlatformStats.countDocuments(),
      redis ? redis.get('metrics:cache:hits') : null,
      redis ? redis.get('metrics:cache:misses') : null,
    ]);

    const hitsNum = Number(hits) || 0;
    const missesNum = Number(misses) || 0;
    const totalCacheRequests = hitsNum + missesNum;

    res.json({
      userCount,
      syncSuccessRate: syncTotalCount ? ((syncOkCount / syncTotalCount) * 100).toFixed(1) : null,
      cacheHitRate: totalCacheRequests ? ((hitsNum / totalCacheRequests) * 100).toFixed(1) : null,
      raw: { syncOkCount, syncTotalCount, hitsNum, missesNum },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };