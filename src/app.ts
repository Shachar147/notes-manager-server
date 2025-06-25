import express from 'express';
import cors from 'cors';
import notesRoutes from './features/notes/notes.routes';
import auditRoutes from './features/audit/audit.routes';
import authRoutes from './features/auth/auth.routes';
import {requestIdMiddleware} from "./middlewares/request-id.middleware";
import {elasticLoggerMiddleware} from "./middlewares/elastic-logger.middleware";
import { authMiddleware } from './features/auth/auth.middleware';
import rateLimitMiddleware from './middlewares/rate-limit.middleware';
import { createChatRouter } from './features/notes/chat.routes';
import { AppDataSource } from './config/database';
import { Note } from './features/notes/notes.entity';
import { NoteEmbedding } from './features/notes/notes.embedding.entity';
import { NoteChatbotUsage } from './features/notes/notes-chatbot-usage.entity';
import { NoteEmbeddingRepository } from './features/notes/notes.embedding.repository';
import { NoteChatbotUsageRepository } from './features/notes/notes-chatbot-usage.repository';
import { NotesChatService } from './features/notes/notes-chat.service';
import { NoteEmbeddingService } from './features/notes/notes.embedding.service';
import { NoteChatbotUsageService } from './features/notes/notes-chatbot-usage.service';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use(requestIdMiddleware);
app.use(elasticLoggerMiddleware); // Request logging middleware

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/notes', rateLimitMiddleware, authMiddleware, notesRoutes);
app.use('/audit', rateLimitMiddleware, authMiddleware, auditRoutes);

// Chat route
AppDataSource.initialize().then(() => {
  const noteRepo = AppDataSource.getRepository(Note);
  const embeddingRepo = AppDataSource.getRepository(NoteEmbedding) as any as NoteEmbeddingRepository;
  const usageRepo = AppDataSource.getRepository(NoteChatbotUsage) as any as NoteChatbotUsageRepository;
  const embeddingService = new NoteEmbeddingService(embeddingRepo);
  const usageService = new NoteChatbotUsageService(usageRepo);
  const chatService = new NotesChatService(embeddingService, noteRepo);
  app.use('/chat', authMiddleware, createChatRouter(chatService, usageService));
});

export default app;