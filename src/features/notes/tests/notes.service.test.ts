// Jest unit tests for notes.service.ts 

import { NotesService } from '../notes.service';
import { NoteRepository } from '../notes.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditTopic } from '../../audit/audit.topics';
import { User } from '../../auth/user.entity';
import { Note } from '../notes.entity';
import { NoteEmbeddingService } from '../notes.embedding.service';

jest.mock('../notes.repository');
jest.mock('../../audit/audit.service');
jest.mock('../notes.embedding.service');

const mockUser: User = { id: 'user1', email: 'test@example.com' } as any;
const mockNote: Note = {
  id: 'note1',
  title: 'Test Note',
  content: 'Test Content',
  user: mockUser,
  userId: mockUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

describe('NotesService', () => {
  let notesService: NotesService;
  let notesRepository: jest.Mocked<NoteRepository>;
  let auditService: jest.Mocked<AuditService>;
  let embeddingService: jest.Mocked<NoteEmbeddingService>;

  beforeEach(() => {
    notesRepository = new (NoteRepository as any)();
    auditService = new (AuditService as any)();
    embeddingService = new (NoteEmbeddingService as any)();
    notesService = new NotesService(embeddingService);
    // Inject mocks
    (notesService as any).notesRepository = notesRepository;
    (notesService as any).auditService = auditService;

    // Mock generateEmbedding to avoid network calls
    jest.spyOn(notesService, 'generateEmbedding').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    it('should create a note and log the event', async () => {
      notesRepository.create.mockResolvedValue(mockNote);
      auditService.logEvent.mockResolvedValue(undefined);
      const result = await notesService.createNote({ title: 'Test Note', content: 'Test Content' }, mockUser);
      expect(notesRepository.create).toHaveBeenCalledWith({ title: 'Test Note', content: 'Test Content' }, mockUser);
      expect(auditService.logEvent).toHaveBeenCalledWith(
        AuditTopic.NOTE_CREATED,
        'note',
        mockNote.id,
        mockUser.id,
        undefined,
        mockNote
      );
      expect(result).toEqual(mockNote);
    });
  });

  describe('updateNote', () => {
    it('should update a note and log the event', async () => {
      notesRepository.findById.mockResolvedValueOnce(mockNote);
      notesRepository.update.mockResolvedValueOnce({ ...mockNote, title: 'Updated' });
      auditService.logEvent.mockResolvedValue(undefined);
      const result = await notesService.updateNote('note1', { title: 'Updated' }, mockUser);
      expect(notesRepository.findById).toHaveBeenCalledWith('note1', mockUser.id);
      expect(notesRepository.update).toHaveBeenCalledWith('note1', { title: 'Updated' }, mockUser);
      expect(auditService.logEvent).toHaveBeenCalledWith(
        AuditTopic.NOTE_UPDATED,
        'note',
        'note1',
        mockUser.id,
        mockNote,
        { ...mockNote, title: 'Updated' }
      );
      expect(result.title).toBe('Updated');
    });
    it('should throw if note not found', async () => {
      notesRepository.findById.mockResolvedValueOnce(null);
      await expect(notesService.updateNote('note1', { title: 'Updated' }, mockUser)).rejects.toThrow('Note with id note1 not found');
    });
    it('should throw if update fails', async () => {
      notesRepository.findById.mockResolvedValueOnce(mockNote);
      notesRepository.update.mockResolvedValueOnce(null);
      await expect(notesService.updateNote('note1', { title: 'Updated' }, mockUser)).rejects.toThrow('Failed to update note with id note1');
    });
  });

  describe('deleteNote', () => {
    it('should delete a note and log the event', async () => {
      notesRepository.findById.mockResolvedValueOnce(mockNote);
      notesRepository.delete.mockResolvedValueOnce(undefined);
      auditService.logEvent.mockResolvedValue(undefined);
      await notesService.deleteNote('note1', mockUser.id);
      expect(notesRepository.findById).toHaveBeenCalledWith('note1', mockUser.id);
      expect(notesRepository.delete).toHaveBeenCalledWith('note1', mockUser.id);
      expect(auditService.logEvent).toHaveBeenCalledWith(
        AuditTopic.NOTE_DELETED,
        'note',
        'note1',
        mockUser.id,
        mockNote,
        undefined
      );
    });
    it('should throw if note not found', async () => {
      notesRepository.findById.mockResolvedValueOnce(null);
      await expect(notesService.deleteNote('note1', mockUser.id)).rejects.toThrow('Note with id note1 not found');
    });
  });

  describe('duplicateNote', () => {
    it('should duplicate a note and log the event', async () => {
      notesRepository.findById.mockResolvedValueOnce(mockNote);
      const duplicated = { ...mockNote, id: 'note2', title: 'Test Note (Copy)' };
      notesRepository.create.mockResolvedValueOnce(duplicated);
      auditService.logEvent.mockResolvedValue(undefined);
      const result = await notesService.duplicateNote('note1', mockUser);
      expect(notesRepository.findById).toHaveBeenCalledWith('note1', mockUser.id);
      expect(notesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test Note (Copy)' }),
        mockUser
      );
      expect(auditService.logEvent).toHaveBeenCalledWith(
        AuditTopic.NOTE_DUPLICATED,
        'note',
        mockNote.id,
        mockUser.id,
        mockNote,
        duplicated
      );
      expect(result).toEqual(duplicated);
    });
    it('should throw if original note not found', async () => {
      notesRepository.findById.mockResolvedValueOnce(null);
      await expect(notesService.duplicateNote('note1', mockUser)).rejects.toThrow('Note with id note1 not found');
    });
  });

  describe('getNote', () => {
    it('should return a note', async () => {
      notesRepository.findById.mockResolvedValueOnce(mockNote);
      const result = await notesService.getNote('note1', mockUser.id);
      expect(notesRepository.findById).toHaveBeenCalledWith('note1', mockUser.id);
      expect(result).toEqual(mockNote);
    });
    it('should throw if note not found', async () => {
      notesRepository.findById.mockResolvedValueOnce(null);
      await expect(notesService.getNote('note1', mockUser.id)).rejects.toThrow('Note with id note1 not found');
    });
  });

  describe('getAllNotes', () => {
    it('should return notes and total', async () => {
      notesRepository.findAll.mockResolvedValueOnce([mockNote]);
      notesRepository.count.mockResolvedValueOnce(1);
      const result = await notesService.getAllNotes(mockUser.id);
      expect(notesRepository.findAll).toHaveBeenCalledWith(mockUser.id);
      expect(notesRepository.count).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ notes: [mockNote], total: 1 });
    });
    it('should return empty array and zero if no notes', async () => {
      notesRepository.findAll.mockResolvedValueOnce([]);
      notesRepository.count.mockResolvedValueOnce(0);
      const result = await notesService.getAllNotes(mockUser.id);
      expect(result).toEqual({ notes: [], total: 0 });
    });
  });
}); 