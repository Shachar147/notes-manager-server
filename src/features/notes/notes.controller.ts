import {Request, Response} from 'express';
import {sendError, sendSuccess} from "../../utils/response-utils";
import {Note} from "./notes.entity";
import { NotesService } from './notes.service';
import {CreateNoteDto, NoteInterface} from "./notes.types";
import { User } from '../auth/user.entity';
import logger from '../../utils/logger';
import Redlock from 'redlock'; 
import redisClient, { REDIS_LOCK_CONFIGURATION } from '../../config/redis';
import { sleep } from '../../utils/utils'
import { NoteEmbeddingService } from './notes.embedding.service';

const redlock = new Redlock([redisClient], REDIS_LOCK_CONFIGURATION);

function formatNote(note: Note): NoteInterface {
    return {
        ...note,
        createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : undefined,
        updatedAt: note.updatedAt ? new Date(note.updatedAt).toISOString() : undefined
    } as NoteInterface;
}

// Factory functions to inject dependencies
export const createGetNoteById = (notesService: NotesService) => async (req: Request, res: Response) => {
    try {
        const user = (req as any).user as User;
        const note = await notesService.getNote(req.params.id, user.id);
        sendSuccess(req, res, formatNote(note));
    } catch (error: any) {
        console.error('Error fetching note:', error);
        sendError(req, res, `Failed to fetch note: ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });
    }
};

export const createGetAllNotes = (notesService: NotesService) => async (req: Request, res: Response) => {
    try {
        const user = (req as any).user as User;
        const { notes, total } = await notesService.getAllNotes(user.id);
        sendSuccess(req, res, {
            total,
            notes: notes.map(formatNote)
        });
    } catch (error: any) {
        console.error('Error fetching notes:', error);
        sendError(req, res, `Failed to fetch notes: ${error.message}`, 500, { "errorMessage": error.message, "excInfo": error.stack });
    }
};

export const createCreateNote = (notesService: NotesService) => async (req: Request<CreateNoteDto>, res: Response) => {
    try {
        const { title, content } = req.body ?? {};
        if (!title) {
            sendError(req, res, 'Missing: title', 400);
            return;
        }
        if (!content) {
            sendError(req, res, 'Missing: content', 400);
            return;
        }

        const user = (req as any).user as User;
        const newNote = await notesService.createNote(
            { title, content },
            user
        );
        sendSuccess(req, res, formatNote(newNote), 201);
    } catch (error: any) {
        console.error('Error creating note:', error);
        sendError(req, res, `Failed to create note: ${error.message}`, 500, { errorMessage: error.message, exc_info: error.stack });
    }
};

export const createUpdateNote = (notesService: NotesService, redlock: Redlock) => async (req: Request, res: Response) => {
    try {
        const { title, content } = req.body ?? {};
        if (!title && !content) {
            sendError(req, res, 'Nothing to update', 400);
            return;
        }

        const noteId = req.params.id;

        // redis lock settings
        const resource = `locks:note:${noteId}`;
        const ttl = 5000;

        let lock;
        try {
            logger.info(`[${noteId}] Attempting to acquire lock...`);
            lock = await redlock.acquire([resource], ttl);
            logger.info(`[${noteId}] Lock acquired!`);

            const updatedFields: Partial<Note> = {};
            if (title) updatedFields.title = title;
            if (content != undefined) updatedFields.content = content;

            const user = (req as any).user as User;
            const updatedNote = await notesService.updateNote(noteId, updatedFields, user);
            sendSuccess(req, res, formatNote(updatedNote));

        } catch (error: any){
            console.error('Error updating note:', error);
            sendError(req, res, `Failed to update note: ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });    
        } 
        finally {
            if (lock){
                await lock.release();
                logger.info(`[${noteId}] Lock released.`);
            }
        }
    } catch (error: any) {
        console.error('Error updating note:', error);
        sendError(req, res, `Failed to update note (2): ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });
    }
};

export const createDeleteNote = (notesService: NotesService) => async (req: Request, res: Response) => {
    try {
        const noteId = req.params.id;
        const user = (req as any).user as User;
        await notesService.deleteNote(noteId, user.id);
        sendSuccess(req, res, { message: `Note ${noteId} deleted successfully` }, 204);
    } catch (error: any) {
        console.error('Error deleting note:', error);
        sendError(req, res, `Failed to delete note: ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });
    }
};

export const createDuplicateNote = (notesService: NotesService) => async (req: Request, res: Response) => {
    try {
        const noteId = req.params.id;
        const user = (req as any).user as User;
        const duplicatedNote = await notesService.duplicateNote(noteId, user);
        sendSuccess(req, res, formatNote(duplicatedNote));
    } catch (error: any) {
        console.error('Error duplicating note:', error);
        sendError(req, res, `Failed to duplicate note: ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });
    }
};