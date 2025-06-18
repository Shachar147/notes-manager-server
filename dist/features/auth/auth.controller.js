"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const response_utils_1 = require("../../utils/response-utils");
class AuthController {
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    async register(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return (0, response_utils_1.sendError)(req, res, 'Email and password are required', 400);
            }
            const result = await this.authService.register(email, password);
            return (0, response_utils_1.sendSuccess)(req, res, {
                user: {
                    id: result.user.id,
                    email: result.user.email
                },
                token: result.token
            }, 201);
        }
        catch (error) {
            if (error.message === 'User with this email already exists') {
                return (0, response_utils_1.sendError)(req, res, error.message, 409);
            }
            return (0, response_utils_1.sendError)(req, res, 'Internal server error', 500, error);
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return (0, response_utils_1.sendError)(req, res, 'Email and password are required', 400);
            }
            const result = await this.authService.login(email, password);
            return (0, response_utils_1.sendSuccess)(req, res, {
                user: {
                    id: result.user.id,
                    email: result.user.email
                },
                token: result.token
            });
        }
        catch (error) {
            if (error.message === 'User not found' || error.message === 'Invalid password') {
                return (0, response_utils_1.sendError)(req, res, 'Invalid credentials', 401);
            }
            return (0, response_utils_1.sendError)(req, res, 'Internal server error', 500, error);
        }
    }
    async getUsers(req, res) {
        try {
            const users = await this.authService.getAllUsers();
            return (0, response_utils_1.sendSuccess)(req, res, { users });
        }
        catch (error) {
            return (0, response_utils_1.sendError)(req, res, 'Failed to fetch users', 500, error);
        }
    }
}
exports.AuthController = AuthController;
