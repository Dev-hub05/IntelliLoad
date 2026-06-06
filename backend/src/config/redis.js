const Redis = require('ioredis');

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = parseInt(process.env.REDIS_PORT || '6379', 10);

const redis = new Redis({
  host,
  port,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('Redis connected successfully.');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

// Cache Helpers
async function setTestState(testId, state) {
  const key = `test:${testId}`;
  await redis.hset(key, state);
  await redis.expire(key, 86400); // 1-day retention for active state/ephemeral logs
}

async function getTestState(testId) {
  return await redis.hgetall(`test:${testId}`);
}

async function cacheMetrics(testId, metricsSnapshot) {
  const key = `metrics:${testId}:latest`;
  await redis.set(key, JSON.stringify(metricsSnapshot), 'EX', 60); // Expire after 60s
}

async function getLatestMetrics(testId) {
  const data = await redis.get(`metrics:${testId}:latest`);
  return data ? JSON.parse(data) : null;
}

module.exports = {
  redis,
  setTestState,
  getTestState,
  cacheMetrics,
  getLatestMetrics
};
