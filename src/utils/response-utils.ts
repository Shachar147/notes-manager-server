import { Response } from 'express'
import logger from "./logger";
import {asyncLocalStorage} from "../config/elasticsearch";

export function sendSuccess(res: Response, data: any, statusCode = 200): Response {
    const store = asyncLocalStorage.getStore();
    const requestId = store.requestId;
    logger.info('Prepare Response', { data, requestId });
    return res.status(statusCode).json({
        "status": "success",
        data,
        requestId
    });
}

export function sendError(res: Response, errorMessage: string, statusCode = 400): Response {
    const store = asyncLocalStorage.getStore();
    const requestId = store.requestId;
    logger.error('Error', { message: errorMessage, requestId });
    return res.status(statusCode).json({
        "status": "error",
        "message": errorMessage,
        requestId
    });
}