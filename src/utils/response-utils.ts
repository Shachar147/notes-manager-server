import { Response } from 'express'
import logger from "./logger";


export function sendSuccess(res: Response, data: any, statusCode = 200): Response {
    logger.info('Prepare Response', { data });
    return res.status(statusCode).json({
        "status": "success",
        data
    });
}

export function sendError(res: Response, errorMessage: string, statusCode = 400): Response {
    logger.error('Error', { message: errorMessage });
    return res.status(statusCode).json({
        "status": "error",
        "message": errorMessage
    });
}