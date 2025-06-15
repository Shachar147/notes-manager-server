import logger from "../utils/logger";

export function elasticLoggerMiddleware(req: Request, res: Response, next: any) {
    const message = `Incoming Request ${req.method} ${req.originalUrl}`;
    console.log(message);
    logger.info(message, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    next();
}