import { RateLimiterRedis } from 'rate-limiter-flexible';
import redisClient, { PER_MINUTE, RATE_LIMITING_MAX_REQUESTS } from '../config/redis';
import { sendError } from '../utils/response-utils';
import { NextFunction } from 'express';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: RATE_LIMITING_MAX_REQUESTS,
  duration: PER_MINUTE
});

const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log("hereee");
    // @ts-ignore
  rateLimiter.consume(req.ip)
    .then(() => next())
    // @ts-ignore
    .catch(() => sendError(req, res, 'Too Many Requests', 429));
};

export default rateLimitMiddleware;