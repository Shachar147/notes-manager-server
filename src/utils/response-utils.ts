import { Response } from 'express'


export function sendSuccess(res: Response, data: any, statusCode = 200): Response {
    return res.status(statusCode).json({
        "status": "success",
        data
    });
}

export function sendError(res: Response, errorMessage: string, statusCode = 400): Response {
    return res.status(statusCode).json({
        "status": "error",
        "message": errorMessage
    });
}