import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendError } from '../../utils/response-utils';
import cookieParser from 'cookie-parser';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Cookies:', req.cookies);
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        if (!token) {
            return sendError(req, res, 'No token provided', 401);
        }

        const authService = new AuthService();
        const user = await authService.validateToken(token);
        
        // Add user to request object
        (req as any).user = user;
        next();
    } catch (error) {
        return sendError(req, res, 'Invalid token', 401, error);
    }
}; 