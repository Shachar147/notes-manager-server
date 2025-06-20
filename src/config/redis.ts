import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});
export default redis;

const USERS_CACHE_TTL_SEC = 60; // 60 sec
const PER_MINUTE = 60; // per minute
const RATE_LIMITING_MAX_REQUESTS = 15; // 15 requests

export { 
    RATE_LIMITING_MAX_REQUESTS,
    PER_MINUTE,
    USERS_CACHE_TTL_SEC 
};