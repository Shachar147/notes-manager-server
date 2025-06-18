"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const notes_repository_1 = require("./notes.repository");
const audit_service_1 = require("../audit/audit.service");
const audit_topics_1 = require("../audit/audit.topics");
class NotesService {
    constructor() {
        this.notesRepository = new notes_repository_1.NoteRepository();
        this.auditService = new audit_service_1.AuditService();
    }
    async createNote(noteData, user) {
        const note = await this.notesRepository.create({
            ...noteData,
        }, user);
        // Log the creation event
        await this.auditService.logEvent(audit_topics_1.AuditTopic.NOTE_CREATED, 'note', note.id, user.id, undefined, note);
        return note;
    }
    async updateNote(id, updates, user) {
        const oldNote = await this.notesRepository.findById(id, user.id);
        if (!oldNote) {
            throw new Error(`Note with id ${id} not found`);
        }
        const updatedNote = await this.notesRepository.update(id, updates, user);
        if (!updatedNote) {
            throw new Error(`Failed to update note with id ${id}`);
        }
        // Log the update event
        await this.auditService.logEvent(audit_topics_1.AuditTopic.NOTE_UPDATED, 'note', id, user.id, oldNote, updatedNote);
        return updatedNote;
    }
    async deleteNote(id, userId) {
        const note = await this.notesRepository.findById(id, userId);
        if (!note) {
            throw new Error(`Note with id ${id} not found`);
        }
        await this.notesRepository.delete(id, userId);
        // Log the deletion event
        await this.auditService.logEvent(audit_topics_1.AuditTopic.NOTE_DELETED, 'note', id, userId, note, undefined);
    }
    async duplicateNote(id, user) {
        const originalNote = await this.notesRepository.findById(id, user.id);
        if (!originalNote) {
            throw new Error(`Note with id ${id} not found`);
        }
        const duplicatedNote = await this.notesRepository.create({
            ...originalNote,
            createdAt: undefined, // Let the database generate created at to NOW
            updatedAt: undefined,
            id: undefined, // Let the database generate a new ID
            title: `${originalNote.title} (Copy)`,
        }, user);
        // Log the duplication event
        await this.auditService.logEvent(audit_topics_1.AuditTopic.NOTE_DUPLICATED, 'note', originalNote.id, user.id, originalNote, duplicatedNote);
        return duplicatedNote;
    }
    async getNote(id, userId) {
        const note = await this.notesRepository.findById(id, userId);
        if (!note) {
            throw new Error(`Note with id ${id} not found`);
        }
        return note;
    }
    async getAllNotes(userId) {
        const [notes, total] = await Promise.all([
            this.notesRepository.findAll(userId),
            this.notesRepository.count(userId)
        ]);
        return { notes, total };
    }
}
exports.NotesService = NotesService;
