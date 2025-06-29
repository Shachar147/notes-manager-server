import { Response, Request } from 'express'
import logger from "./logger";
import {asyncLocalStorage} from "../config/elasticsearch";

export function sendSuccess(req: Request<any, any, any, any>, res: Response, data: Record<string, any>, statusCode = 200): Response {
    const store = asyncLocalStorage.getStore();
    const requestId = store?.requestId;
    const message = `Prepare Response for ${req.method} ${req.originalUrl}`;

    // do not print the data. A - sensitive info, B - data may change and then elastic indexing will fail
    // logger.info(message, { data, requestId });
    logger.info(message, { requestId });
    return res.status(statusCode).json({
        "status": "success",
        data,
        requestId
    });
}

export function sendError(req: Request<any, any, any, any>, res: Response, errorMessage: string, statusCode = 400, error: any = {}): Response {
    const store = asyncLocalStorage.getStore();
    const requestId = store?.requestId;
    const message = `Failed to handle ${req.method} ${req.originalUrl}`;
    const errorDetails = {
        message: errorMessage,
        stack: error?.stack,
        ...error
    };
    logger.error(message, { error: errorDetails, requestId, statusCode });
    return res.status(statusCode).json({
        "status": "error",
        "message": errorMessage,
        requestId,
        error
    });
}