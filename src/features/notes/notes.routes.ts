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
import Redlock from 'redlock';
import redisClient from '../../config/redis';

const redlock = new Redlock([redisClient]);

// This is a placeholder. In a real app, the repository would be injected.
const embeddingService = new NoteEmbeddingService({} as any); 
const notesService = new NotesService(embeddingService);

const router = Router();

router.get('/', createGetAllNotes(notesService));
router.get('/:id', createGetNoteById(notesService));
router.post('/', createCreateNote(notesService));
router.put('/:id', createUpdateNote(notesService, redlock));
router.delete('/:id', createDeleteNote(notesService));
router.post('/:id/duplicate', createDuplicateNote(notesService));

export default router;