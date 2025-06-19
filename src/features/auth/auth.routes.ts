import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/google', authController.loginWithGoogle.bind(authController))
router.get('/google/callback', (req, res) => res.redirect('/'));
router.get('/users', authController.getUsers.bind(authController));

export default router; 