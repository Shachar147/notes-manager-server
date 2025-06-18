"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteById = getNoteById;
exports.getAllNotes = getAllNotes;
exports.createNote = createNote;
exports.updateNote = updateNote;
exports.deleteNote = deleteNote;
exports.duplicateNote = duplicateNote;
const response_utils_1 = require("../../utils/response-utils");
const notes_service_1 = require("./notes.service");
const notesService = new notes_service_1.NotesService();
function formatNote(note) {
    return {
        ...note,
        createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : undefined,
        updatedAt: note.updatedAt ? new Date(note.updatedAt).toISOString() : undefined
    };
}
async function getNoteById(req, res) {
    try {
        const user = req.user;
        const note = await notesService.getNote(req.params.id, user.id);
        (0, response_utils_1.sendSuccess)(req, res, formatNote(note));
    }
    catch (error) {
        console.error('Error fetching note:', error);
        (0, response_utils_1.sendError)(req, res, `Failed to fetch note: ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });
    }
}
async function getAllNotes(req, res) {
    try {
        const user = req.user;
        const { notes, total } = await notesService.getAllNotes(user.id);
        (0, response_utils_1.sendSuccess)(req, res, {
            notes: notes.map(formatNote),
            total
        });
    }
    catch (error) {
        console.error('Error fetching notes:', error);
        (0, response_utils_1.sendError)(req, res, `Failed to fetch notes: ${error.message}`, 500, { "errorMessage": error.message, "excInfo": error.stack });
    }
}
async function createNote(req, res) {
    try {
        const { title, content } = req.body ?? {};
        if (!title) {
            (0, response_utils_1.sendError)(req, res, 'Missing: title', 400);
            return;
        }
        if (!content) {
            (0, response_utils_1.sendError)(req, res, 'Missing: content', 400);
            return;
        }
        const user = req.user;
        const newNote = await notesService.createNote({ title, content }, user);
        (0, response_utils_1.sendSuccess)(req, res, formatNote(newNote), 201);
    }
    catch (error) {
        console.error('Error creating note:', error);
        (0, response_utils_1.sendError)(req, res, `Failed to create note: ${error.message}`, 500, { errorMessage: error.message, exc_info: error.stack });
    }
}
async function updateNote(req, res) {
    try {
        const { title, content } = req.body ?? {};
        if (!title && !content) {
            (0, response_utils_1.sendError)(req, res, 'Nothing to update', 400);
            return;
        }
        const noteId = req.params.id;
        const updatedFields = {};
        if (title)
            updatedFields.title = title;
        if (content != undefined)
            updatedFields.content = content;
        const user = req.user;
        const updatedNote = await notesService.updateNote(noteId, updatedFields, user);
        (0, response_utils_1.sendSuccess)(req, res, formatNote(updatedNote));
    }
    catch (error) {
        console.error('Error updating note:', error);
        (0, response_utils_1.sendError)(req, res, `Failed to update note: ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });
    }
}
async function deleteNote(req, res) {
    try {
        const noteId = req.params.id;
        const user = req.user;
        await notesService.deleteNote(noteId, user.id);
        (0, response_utils_1.sendSuccess)(req, res, { message: `Note ${noteId} deleted successfully` }, 204);
    }
    catch (error) {
        console.error('Error deleting note:', error);
        (0, response_utils_1.sendError)(req, res, `Failed to delete note: ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });
    }
}
async function duplicateNote(req, res) {
    try {
        const noteId = req.params.id;
        const user = req.user;
        const duplicatedNote = await notesService.duplicateNote(noteId, user);
        (0, response_utils_1.sendSuccess)(req, res, formatNote(duplicatedNote));
    }
    catch (error) {
        console.error('Error duplicating note:', error);
        (0, response_utils_1.sendError)(req, res, `Failed to duplicate note: ${error.message}`, error.message.includes('not found') ? 404 : 500, { errorMessage: error.message, exc_info: error.stack });
    }
}
