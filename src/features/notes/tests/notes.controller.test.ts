// Jest unit tests for notes.controller.ts 

import {
    createGetNoteById,
    createGetAllNotes,
    createCreateNote,
    createUpdateNote,
    createDeleteNote,
    createDuplicateNote
} from '../notes.controller';
import { User } from '../../auth/user.entity';
import { Note } from '../notes.entity';
import { Request, Response } from 'express';
import { NotesService } from '../notes.service';
import { AuditService } from '../../audit/audit.service';

// Mock console.error to suppress expected error logging during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock the response-utils module
jest.mock('../../../utils/response-utils', () => ({
  sendSuccess: jest.fn(),
  sendError: jest.fn()
}));

jest.mock('../notes.service');
jest.mock('../../audit/audit.service');

const { sendSuccess, sendError } = require('../../../utils/response-utils');

const mockUser: User = { id: 'user1', email: 'test@example.com' } as any;
const mockNote: Note = {
  id: 'note1',
  title: 'Test Note',
  content: 'Test Content',
  user: mockUser,
  userId: mockUser.id,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-01T00:00:00.000Z'),
} as any;

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('notes.controller', () => {
  let req: any;
  let res: any;
  let mockNotesService: jest.Mocked<NotesService>;

  beforeEach(() => {
    req = { params: {}, body: {}, user: mockUser };
    res = mockRes();
    
    // Create a fresh mock for each test
    mockNotesService = {
        getNote: jest.fn().mockResolvedValue(mockNote),
        getAllNotes: jest.fn().mockResolvedValue({ notes: [mockNote], total: 1 }),
        createNote: jest.fn().mockResolvedValue(mockNote),
        updateNote: jest.fn().mockResolvedValue({ ...mockNote, title: 'Updated' }),
        deleteNote: jest.fn().mockResolvedValue(undefined),
        duplicateNote: jest.fn().mockResolvedValue({ ...mockNote, id: 'note2', title: 'Test Note (Copy)' }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNoteById', () => {
    it('should return a note', async () => {
      req.params.id = 'note1';
      const getNoteById = createGetNoteById(mockNotesService);
      await getNoteById(req, res);
      expect(mockNotesService.getNote).toHaveBeenCalledWith('note1', mockUser.id);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ id: 'note1' }));
    });
    it('should handle not found error', async () => {
      req.params.id = 'note1';
      (mockNotesService.getNote as jest.Mock).mockRejectedValueOnce(new Error('Note with id note1 not found'));
      const getNoteById = createGetNoteById(mockNotesService);
      await getNoteById(req, res);
      expect(sendError).toHaveBeenCalledWith(
        req, 
        res, 
        'Failed to fetch note: Note with id note1 not found', 
        404, 
        expect.any(Object)
      );
    });
  });

  describe('getAllNotes', () => {
    it('should return all notes', async () => {
      const getAllNotes = createGetAllNotes(mockNotesService);
      await getAllNotes(req, res);
      expect(mockNotesService.getAllNotes).toHaveBeenCalledWith(mockUser.id);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ 
        total: 1, 
        notes: expect.any(Array) 
      }));
    });
    it('should handle error', async () => {
      (mockNotesService.getAllNotes as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
      const getAllNotes = createGetAllNotes(mockNotesService);
      await getAllNotes(req, res);
      expect(sendError).toHaveBeenCalledWith(
        req, 
        res, 
        'Failed to fetch notes: DB error', 
        500, 
        expect.any(Object)
      );
    });
  });

  describe('createNote', () => {
    it('should create a note', async () => {
      req.body = { title: 'Test Note', content: 'Test Content' };
      const createNote = createCreateNote(mockNotesService);
      await createNote(req, res);
      expect(mockNotesService.createNote).toHaveBeenCalledWith({ title: 'Test Note', content: 'Test Content' }, mockUser);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ id: 'note1' }), 201);
    });
    it('should handle missing title', async () => {
      req.body = { content: 'Test Content' };
      const createNote = createCreateNote(mockNotesService);
      await createNote(req, res);
      expect(sendError).toHaveBeenCalledWith(req, res, 'Missing: title', 400);
    });
    it('should handle missing content', async () => {
      req.body = { title: 'Test Note' };
      const createNote = createCreateNote(mockNotesService);
      await createNote(req, res);
      expect(sendError).toHaveBeenCalledWith(req, res, 'Missing: content', 400);
    });
    it('should handle error', async () => {
      req.body = { title: 'Test Note', content: 'Test Content' };
      (mockNotesService.createNote as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
      const createNote = createCreateNote(mockNotesService);
      await createNote(req, res);
      expect(sendError).toHaveBeenCalledWith(
        req, 
        res, 
        'Failed to create note: DB error', 
        500, 
        expect.any(Object)
      );
    });
  });

  describe('updateNote', () => {
    it('should update a note', async () => {
      req.params.id = 'note1';
      req.body = { title: 'Updated' };
      // Mock lock acquire/release
      const redlock = { acquire: jest.fn().mockResolvedValue({ release: jest.fn() }) } as any;
      const updateNote = createUpdateNote(mockNotesService, redlock);
      await updateNote(req, res);
      expect(mockNotesService.updateNote).toHaveBeenCalledWith('note1', { title: 'Updated' }, mockUser);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ title: 'Updated' }));
    });
    it('should handle nothing to update', async () => {
      req.body = {};
      const redlock = { acquire: jest.fn() } as any;
      const updateNote = createUpdateNote(mockNotesService, redlock);
      await updateNote(req, res);
      expect(sendError).toHaveBeenCalledWith(req, res, 'Nothing to update', 400);
    });
    it('should handle update error', async () => {
      req.params.id = 'note1';
      req.body = { title: 'Updated' };
      (mockNotesService.updateNote as jest.Mock).mockRejectedValueOnce(new Error('Note with id note1 not found'));
      // Mock lock acquire/release
      const redlock = { acquire: jest.fn().mockResolvedValue({ release: jest.fn() }) } as any;
      const updateNote = createUpdateNote(mockNotesService, redlock);
      await updateNote(req, res);
      expect(sendError).toHaveBeenCalledWith(
        req, 
        res, 
        'Failed to update note: Note with id note1 not found', 
        404, 
        expect.any(Object)
      );
    });
  });

  describe('deleteNote', () => {
    it('should delete a note', async () => {
      req.params.id = 'note1';
      const deleteNote = createDeleteNote(mockNotesService);
      await deleteNote(req, res);
      expect(mockNotesService.deleteNote).toHaveBeenCalledWith('note1', mockUser.id);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, { message: 'Note note1 deleted successfully' }, 204);
    });
    it('should handle error', async () => {
      req.params.id = 'note1';
      (mockNotesService.deleteNote as jest.Mock).mockRejectedValueOnce(new Error('Note with id note1 not found'));
      const deleteNote = createDeleteNote(mockNotesService);
      await deleteNote(req, res);
      expect(sendError).toHaveBeenCalledWith(
        req, 
        res, 
        'Failed to delete note: Note with id note1 not found', 
        404, 
        expect.any(Object)
      );
    });
  });

  describe('duplicateNote', () => {
    it('should duplicate a note', async () => {
      req.params.id = 'note1';
      const duplicateNote = createDuplicateNote(mockNotesService);
      await duplicateNote(req, res);
      expect(mockNotesService.duplicateNote).toHaveBeenCalledWith('note1', mockUser);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ 
        id: 'note2', 
        title: 'Test Note (Copy)' 
      }));
    });
    it('should handle error', async () => {
      req.params.id = 'note1';
      (mockNotesService.duplicateNote as jest.Mock).mockRejectedValueOnce(new Error('Note with id note1 not found'));
      const duplicateNote = createDuplicateNote(mockNotesService);
      await duplicateNote(req, res);
      expect(sendError).toHaveBeenCalledWith(
        req, 
        res, 
        'Failed to duplicate note: Note with id note1 not found', 
        404, 
        expect.any(Object)
      );
    });
  });
}); 