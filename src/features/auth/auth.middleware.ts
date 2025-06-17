import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendError } from '../../utils/response-utils';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return sendError(req, res, 'No token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return sendError(req, res, 'Invalid token format', 401);
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