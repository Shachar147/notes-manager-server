import { RateLimiterRedis } from 'rate-limiter-flexible';
import redisClient from '../config/redis';
import { sendError } from '../utils/response-utils';
import { NextFunction } from 'express';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 15, // 30 requests
  duration: 60, // per minute
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