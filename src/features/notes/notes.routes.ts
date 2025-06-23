import { Router } from 'express';
import {
    createGetNoteById,
    createGetAllNotes,
    createCreateNote,
    createUpdateNote,
    createDeleteNote,
    createDuplicateNote
} from './notes.controller';
import { NotesService } from './notes.service';
import { NoteEmbeddingService } from './notes.embedding.service';
import { NoteEmbeddingRepository } from './notes.embedding.repository';
import { NoteEmbedding } from './notes.embedding.entity';
import { rabbitMQService } from '../../services/rabbitmq.service';
import Redlock from 'redlock';
import redisClient from '../../config/redis';
import { AppDataSource } from '../../config/database';
import { NoteChatbotUsageService } from './notes-chatbot-usage.service';
import { NoteChatbotUsageRepository } from './notes-chatbot-usage.repository';
import { NoteChatbotUsage } from './notes-chatbot-usage.entity';

const redlock = new Redlock([redisClient]);

// Initialize services with proper dependencies
const noteEmbeddingRepository = new NoteEmbeddingRepository(NoteEmbedding, AppDataSource.manager);
const embeddingService = new NoteEmbeddingService(noteEmbeddingRepository);
const noteChatbotUsageRepository = new NoteChatbotUsageRepository(NoteChatbotUsage, AppDataSource.manager);
const usageService = new NoteChatbotUsageService(noteChatbotUsageRepository);
const notesService = new NotesService(embeddingService, rabbitMQService, usageService);

const router = Router();

router.get('/', createGetAllNotes(notesService));
router.get('/:id', createGetNoteById(notesService));
router.post('/', createCreateNote(notesService));
router.put('/:id', createUpdateNote(notesService, redlock));
router.delete('/:id', createDeleteNote(notesService));
router.post('/:id/duplicate', createDuplicateNote(notesService));

export default router;