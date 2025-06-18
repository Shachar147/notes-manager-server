"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const auth_service_1 = require("./auth.service");
const response_utils_1 = require("../../utils/response-utils");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return (0, response_utils_1.sendError)(req, res, 'No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return (0, response_utils_1.sendError)(req, res, 'Invalid token format', 401);
        }
        const authService = new auth_service_1.AuthService();
        const user = await authService.validateToken(token);
        // Add user to request object
        req.user = user;
        next();
    }
    catch (error) {
        return (0, response_utils_1.sendError)(req, res, 'Invalid token', 401, error);
    }
};
exports.authMiddleware = authMiddleware;
