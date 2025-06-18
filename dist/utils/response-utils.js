"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
const logger_1 = __importDefault(require("./logger"));
const elasticsearch_1 = require("../config/elasticsearch");
function sendSuccess(req, res, data, statusCode = 200) {
    const store = elasticsearch_1.asyncLocalStorage.getStore();
    const requestId = store?.requestId;
    const message = `Prepare Response for ${req.method} ${req.originalUrl}`;
    logger_1.default.info(message, { data, requestId });
    return res.status(statusCode).json({
        "status": "success",
        data,
        requestId
    });
}
function sendError(req, res, errorMessage, statusCode = 400, error = {}) {
    const store = elasticsearch_1.asyncLocalStorage.getStore();
    const requestId = store?.requestId;
    const message = `Failed to handle ${req.method} ${req.originalUrl}`;
    const errorDetails = {
        message: errorMessage,
        stack: error?.stack,
        ...error
    };
    logger_1.default.error(message, { error: errorDetails, requestId });
    return res.status(statusCode).json({
        "status": "error",
        "message": errorMessage,
        requestId,
        error
    });
}
