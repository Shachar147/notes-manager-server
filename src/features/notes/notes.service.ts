import { NoteRepository } from './notes.repository';
import { Note } from './notes.entity';
import { AuditService } from '../audit/audit.service';
import { AuditTopic } from '../audit/audit.topics';
import { User } from '../auth/user.entity';
import { NoteEmbeddingService } from './notes.embedding.service';
import { rabbitMQService, RabbitMQService } from '../../services/rabbitmq.service';
import { NoteTopic } from './notes.topics';

export class NotesService {
    private notesRepository: NoteRepository;
    private auditService: AuditService;
    private embeddingService: NoteEmbeddingService;
    private rabbitmqService: RabbitMQService;

    constructor(embeddingService: NoteEmbeddingService, rabbitmqService: RabbitMQService) {
        this.notesRepository = new NoteRepository();
        this.auditService = new AuditService();
        this.embeddingService = embeddingService;
        this.rabbitmqService = rabbitmqService;
    }

    async createNote(noteData: Partial<Note>, user: User): Promise<Note> {
        const note = await this.notesRepository.create({
            ...noteData,
        }, user);
        
        // Log the creation event
        await this.auditService.logEvent(
            AuditTopic.NOTE_CREATED,
            'note',
            note.id,
            user.id,
            undefined,
            note
        );

        // Publish event to RabbitMQ
        console.log("about to publish note created event");
        await rabbitMQService.publishEvent(NoteTopic.NOTE_CREATED, note);

        return note;
    }

    async updateNote(id: string, updates: Partial<Note>, user: User): Promise<Note> {
        const oldNote = await this.notesRepository.findById(id, user.id);
        if (!oldNote) {
            throw new Error(`Note with id ${id} not found`);
        }

        const updatedNote = await this.notesRepository.update(id, updates, user);
        if (!updatedNote) {
            throw new Error(`Failed to update note with id ${id}`);
        }

        // Log the update event
        await this.auditService.logEvent(
            AuditTopic.NOTE_UPDATED,
            'note',
            id,
            user.id,
            oldNote,
            updatedNote
        );

        // Publish event to RabbitMQ
        await rabbitMQService.publishEvent(NoteTopic.NOTE_UPDATED, updatedNote);

        return updatedNote;
    }

    async deleteNote(id: string, userId: string): Promise<void> {
        const note = await this.notesRepository.findById(id, userId);
        if (!note) {
            throw new Error(`Note with id ${id} not found`);
        }

        await this.embeddingService.delete(id);

        await this.notesRepository.delete(id, userId);

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

    async duplicateNote(id: string, user: User): Promise<Note> {
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
        await this.auditService.logEvent(
            AuditTopic.NOTE_DUPLICATED,
            'note',
            originalNote.id,
            user.id,
            originalNote,
            duplicatedNote
        );

        return duplicatedNote;
    }

    async getNote(id: string, userId: string): Promise<Note> {
        const note = await this.notesRepository.findById(id, userId);
        if (!note) {
            throw new Error(`Note with id ${id} not found`);
        }
        return note;
    }

    async getAllNotes(userId: string): Promise<{ notes: Note[], total: number }> {
        const [notes, total] = await Promise.all([
            this.notesRepository.findAll(userId),
            this.notesRepository.count(userId)
        ]);
        return { notes, total };
    }
} 