import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response-utils';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async register(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return sendError(req, res, 'Email and password are required', 400);
            }

            const result = await this.authService.register(email, password);
            return sendSuccess(req, res, {
                user: {
                    id: result.user.id,
                    email: result.user.email
                },
                token: result.token
            }, 201);
        } catch (error: any) {
            if (error.message === 'User with this email already exists') {
                return sendError(req, res, error.message, 409);
            }
            return sendError(req, res, 'Internal server error', 500, error);
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return sendError(req, res, 'Email and password are required', 400);
            }

            const result = await this.authService.login(email, password);
            return sendSuccess(req, res, {
                user: {
                    id: result.user.id,
                    email: result.user.email
                },
                token: result.token
            });
        } catch (error: any) {
            if (error.message === 'User not found' || error.message === 'Invalid password') {
                return sendError(req, res, 'Invalid credentials', 401);
            }
            return sendError(req, res, 'Internal server error', 500, error);
        }
    }
} 