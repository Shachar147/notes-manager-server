"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.elasticLoggerMiddleware = elasticLoggerMiddleware;
const logger_1 = __importDefault(require("../utils/logger"));
function elasticLoggerMiddleware(req, res, next) {
    const message = `Incoming Request ${req.method} ${req.originalUrl}`;
    console.log(message);
    logger_1.default.info(message, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    next();
}
