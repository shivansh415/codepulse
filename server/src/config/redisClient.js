const Redis = require('ioredis');

// KV_URL is the name injected by Vercel's Upstash integration. Without a URL, caching is disabled.
const url = process.env.REDIS_URL || process.env.KV_URL;

let redis = null;
if (url) {
  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
  });

  redis.on('connect', () => console.log('Redis connected'));
  redis.on('error', (err) => console.error('Redis error:', err.message));
} else {
  console.log('REDIS_URL not set, running without cache');
}

module.exports = redis;
