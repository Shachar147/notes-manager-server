import { NoteRepository } from './notes.repository';
import { Note } from './notes.entity';
import { AuditService } from '../audit/audit.service';
import { AuditTopic } from '../audit/audit.topics';

export class NotesService {
    private notesRepository: NoteRepository;
    private auditService: AuditService;

    constructor() {
        this.notesRepository = new NoteRepository();
        this.auditService = new AuditService();
    }

    async createNote(noteData: Partial<Note>, userId: string): Promise<Note> {
        const note = await this.notesRepository.create(noteData);
        
        // Log the creation event
        await this.auditService.logEvent(
            AuditTopic.NOTE_CREATED,
            'note',
            note.id,
            userId,
            undefined,
            note
        );

        return note;
    }

    async updateNote(id: string, updates: Partial<Note>, userId: string): Promise<Note> {
        const oldNote = await this.notesRepository.findById(id);
        if (!oldNote) {
            throw new Error(`Note with id ${id} not found`);
        }

        const updatedNote = await this.notesRepository.update(id, updates);
        if (!updatedNote) {
            throw new Error(`Failed to update note with id ${id}`);
        }

        // Log the update event
        await this.auditService.logEvent(
            AuditTopic.NOTE_UPDATED,
            'note',
            id,
            userId,
            oldNote,
            updatedNote
        );

        return updatedNote;
    }

    async deleteNote(id: string, userId: string): Promise<void> {
        const note = await this.notesRepository.findById(id);
        if (!note) {
            throw new Error(`Note with id ${id} not found`);
        }

        await this.notesRepository.delete(id);

        // Log the deletion event
        await this.auditService.logEvent(
            AuditTopic.NOTE_DELETED,
            'note',
            id,
            userId,
            note,
            undefined
        );
    }

    async duplicateNote(id: string, userId: string): Promise<Note> {
        const originalNote = await this.notesRepository.findById(id);
        if (!originalNote) {
            throw new Error(`Note with id ${id} not found`);
        }

        const duplicatedNote = await this.notesRepository.create({
            ...originalNote,
            createdAt: undefined, // Let the database generate created at to NOW
            updatedAt: undefined,
            id: undefined, // Let the database generate a new ID
            title: `${originalNote.title} (Copy)`
        });

        // Log the duplication event
        await this.auditService.logEvent(
            AuditTopic.NOTE_DUPLICATED,
            'note',
            originalNote.id,
            userId,
            originalNote,
            duplicatedNote
        );

        return duplicatedNote;
    }

    async getNote(id: string): Promise<Note> {
        const note = await this.notesRepository.findById(id);
        if (!note) {
            throw new Error(`Note with id ${id} not found`);
        }
        return note;
    }

    async getAllNotes(): Promise<Note[]> {
        return this.notesRepository.findAll();
    }
} 