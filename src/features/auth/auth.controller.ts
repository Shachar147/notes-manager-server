import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response-utils';
import { OAuth2Client } from 'google-auth-library';
import logger from '../../utils/logger';
import redisClient from '../../config/redis';


const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

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

    async loginWithGoogle(req: Request, res: Response) {
        const { idToken } = req.body;
        if (!idToken) {
            return sendError(req, res, 'Missing idToken', 400)
        }

        try {
            // 1. Verify Google ID Token
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: googleClientId,
            });
            const payload = ticket.getPayload();
            if (!payload){
                return sendError(req, res, 'User not found in google', 404)
            }

            const googleId = payload.sub;
            const email = payload.email;
            const name = payload.name;
            const picture = payload.picture;

            // 2. Find or create user
            const user = await this.authService.upsertGoogleUser(googleId, email!, picture)

            // 3. Create JWT
            const token = this.authService.generateToken(user);

            return sendSuccess(req, res, { token, user: { id: user.id, email: user.email, picture: user.profilePicture } });
        } catch (err) {
            logger.error('Google login error', err)
            return sendError(req, res, 'Invalid Google Token', 401);
        }
    }

    async getUsers(req: Request, res: Response) {
        try {
            const cacheKey = 'users:all';
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                console.log("Querying users from cache")
                logger.info("Querying users from cache")
                return sendSuccess(req, res,JSON.parse(cached));
            }

            const users = await this.authService.getAllUsers();

            await redisClient.set(cacheKey, JSON.stringify({ users }), 'EX', 60); // cache for 60s
            return sendSuccess(req, res, { users });
        } catch (error) {
            return sendError(req, res, 'Failed to fetch users', 500, error);
        }
    }
} 