import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});
export default redis;

// cache
export const USERS_CACHE_TTL_SEC = 60; // 60 sec

// rate limiting
export const PER_MINUTE = 60; // per minute
export const RATE_LIMITING_MAX_REQUESTS = 15; // 15 requests

// locks
export const REDIS_LOCK_CONFIGURATION =  {
    retryCount: 30,           // number of times to retry
    retryDelay: 200,          // time in ms between retries
    retryJitter: 200,         // random ms added to retry delay
    // You can increase retryCount or retryDelay to wait longer
}