import {Request, Response} from 'express';
import {sendError, sendSuccess} from "../../utils/response-utils";
import {Note} from "./notes.entity";
import { NoteRepository } from './notes.repository';
import {CreateNoteDto, NoteInterface} from "./notes.types";

const noteRepository = new NoteRepository();

function formatNote(note: Note): NoteInterface {
    return {
        ...note,
        createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : undefined,
        updatedAt: note.updatedAt ? new Date(note.updatedAt).toISOString() : undefined
    } as NoteInterface;
}

export async function getNoteById(req: Request, res: Response): Promise<void> {
    try {
        const note = await noteRepository.findById(req.params.id);
        if (!note) {
            sendError(res, `Note ${req.params.id} not found`, 404);
            return;
        }
        sendSuccess(res, formatNote(note));
    } catch (error: any) {
        console.error('Error fetching note:', error);
        sendError(res, `Failed to fetch note: ${error.message}`, 500);
    }
}

export async function getAllNotes(_req: Request, res: Response): Promise<void> {
    try {
        const notes = await noteRepository.findAll();
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
        
        const newNote = await noteRepository.create({ title, content: description });
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

        const updatedNote = await noteRepository.update(noteId, updatedFields);
        if (!updatedNote) {
            sendError(res, `Note ${noteId} not found`, 404);
            return;
        }
        sendSuccess(res, formatNote(updatedNote));
    } catch (error: any) {
        console.error('Error updating note:', error);
        sendError(res, `Failed to update note: ${error.message}`, 500);
    }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
    try {
        const noteId = req.params.id;
        const noteToDelete = await noteRepository.findById(noteId);
        if (!noteToDelete) {
            sendError(res, `Note ${noteId} not found`, 404);
            return;
        }
        await noteRepository.delete(noteId);
        sendSuccess(res, `Note ${noteId} deleted successfully`, 204);
    } catch (error: any) {
        console.error('Error deleting note:', error);
        sendError(res, `Failed to delete note: ${error.message}`, 500);
    }
}