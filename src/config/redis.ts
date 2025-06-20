import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

const USERS_CACHE_TTL_SEC = 60; // 60 sec

export { USERS_CACHE_TTL_SEC };

export default redis;