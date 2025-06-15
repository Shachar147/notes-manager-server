import {Request, Response} from 'express';
import {sendError, sendSuccess} from "../../utils/response-utils";
import {Note} from "./notes.entity";
import { NotesService } from './notes.service';
import {CreateNoteDto, NoteInterface} from "./notes.types";

const notesService = new NotesService();

function formatNote(note: Note): NoteInterface {
    return {
        ...note,
        createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : undefined,
        updatedAt: note.updatedAt ? new Date(note.updatedAt).toISOString() : undefined
    } as NoteInterface;
}

export async function getNoteById(req: Request, res: Response): Promise<void> {
    try {
        const note = await notesService.getNote(req.params.id);
        sendSuccess(res, formatNote(note));
    } catch (error: any) {
        console.error('Error fetching note:', error);
        sendError(res, `Failed to fetch note: ${error.message}`, error.message.includes('not found') ? 404 : 500);
    }
}

export async function getAllNotes(_req: Request, res: Response): Promise<void> {
    try {
        const notes = await notesService.getAllNotes();
        sendSuccess(res, notes.map(formatNote));
    } catch (error: any) {
        console.error('Error fetching notes:', error);
        sendError(res, `Failed to fetch notes: ${error.message}`, 500);
    }
}

export async function createNote(req: Request<CreateNoteDto>, res: Response): Promise<void> {
    try {
        const { title, description } = req.body ?? {};
        if (!title) {
            sendError(res, 'Missing: title', 400);
            return;
        }
        if (!description) {
            sendError(res, 'Missing: description', 400);
            return;
        }
        
        // TODO: Replace with actual user ID from authentication
        const userId = '0';
        const newNote = await notesService.createNote(
            { title, content: description },
            userId
        );
        sendSuccess(res, formatNote(newNote), 201);
    } catch (error: any) {
        console.error('Error creating note:', error);
        sendError(res, `Failed to create note: ${error.message}`, 500);
    }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
    try {
        const { title, description } = req.body ?? {};
        if (!title && !description) {
            sendError(res, 'Nothing to update', 400);
            return;
        }

        const noteId = req.params.id;
        const updatedFields: Partial<Note> = {};
        if (title) updatedFields.title = title;
        if (description) updatedFields.content = description;

        // TODO: Replace with actual user ID from authentication
        const userId = '0';
        const updatedNote = await notesService.updateNote(noteId, updatedFields, userId);
        sendSuccess(res, formatNote(updatedNote));
    } catch (error: any) {
        console.error('Error updating note:', error);
        sendError(res, `Failed to update note: ${error.message}`, error.message.includes('not found') ? 404 : 500);
    }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
    try {
        const noteId = req.params.id;
        // TODO: Replace with actual user ID from authentication
        const userId = '0';
        await notesService.deleteNote(noteId, userId);
        sendSuccess(res, `Note ${noteId} deleted successfully`, 204);
    } catch (error: any) {
        console.error('Error deleting note:', error);
        sendError(res, `Failed to delete note: ${error.message}`, error.message.includes('not found') ? 404 : 500);
    }
}

export async function duplicateNote(req: Request, res: Response): Promise<void> {
    try {
        const noteId = req.params.id;
        // TODO: Replace with actual user ID from authentication
        const userId = '0';
        const duplicatedNote = await notesService.duplicateNote(noteId, userId);
        sendSuccess(res, formatNote(duplicatedNote));
    } catch (error: any) {
        console.error('Error duplicating note:', error);
        sendError(res, `Failed to duplicate note: ${error.message}`, error.message.includes('not found') ? 404 : 500);
    }
}