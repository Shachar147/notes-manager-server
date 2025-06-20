import express from 'express';
import cors from 'cors';
import notesRoutes from './features/notes/notes.routes';
import auditRoutes from './features/audit/audit.routes';
import authRoutes from './features/auth/auth.routes';
import {requestIdMiddleware} from "./middlewares/request-id.middleware";
import {elasticLoggerMiddleware} from "./middlewares/elastic-logger.middleware";
import { authMiddleware } from './features/auth/auth.middleware';
import rateLimitMiddleware from './middlewares/rate-limit.middleware';

const app = express();

app.use(cors());
app.use(express.json())

app.use(requestIdMiddleware);
app.use(elasticLoggerMiddleware); // Request logging middleware

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/notes', rateLimitMiddleware, authMiddleware, notesRoutes);
app.use('/audit', rateLimitMiddleware, authMiddleware, auditRoutes);

export default app;