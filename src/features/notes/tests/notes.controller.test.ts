// Jest unit tests for notes.controller.ts 

import { getNoteById, getAllNotes, createNote, updateNote, deleteNote, duplicateNote, notesService } from '../notes.controller';
import { User } from '../../auth/user.entity';
import { Note } from '../notes.entity';

// Mock the response-utils module
jest.mock('../../../utils/response-utils', () => ({
  sendSuccess: jest.fn(),
  sendError: jest.fn()
}));

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
  let sendSuccess: jest.MockedFunction<any>;
  let sendError: jest.MockedFunction<any>;

  beforeEach(() => {
    req = { params: {}, body: {}, user: mockUser };
    res = mockRes();

    // Get the mocked functions
    const responseUtils = require('../../../utils/response-utils');
    sendSuccess = responseUtils.sendSuccess;
    sendError = responseUtils.sendError;

    // Reset mocks
    sendSuccess.mockClear();
    sendError.mockClear();

    // Mock the singleton instance methods
    jest.spyOn(notesService, 'getNote').mockResolvedValue(mockNote);
    jest.spyOn(notesService, 'getAllNotes').mockResolvedValue({ notes: [mockNote], total: 1 });
    jest.spyOn(notesService, 'createNote').mockResolvedValue(mockNote);
    jest.spyOn(notesService, 'updateNote').mockResolvedValue({ ...mockNote, title: 'Updated' });
    jest.spyOn(notesService, 'deleteNote').mockResolvedValue(undefined);
    jest.spyOn(notesService, 'duplicateNote').mockResolvedValue({ ...mockNote, id: 'note2', title: 'Test Note (Copy)' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNoteById', () => {
    it('should return a note', async () => {
      req.params.id = 'note1';
      await getNoteById(req, res);
      expect(notesService.getNote).toHaveBeenCalledWith('note1', mockUser.id);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ id: 'note1' }));
    });
    it('should handle not found error', async () => {
      req.params.id = 'note1';
      (notesService.getNote as jest.Mock).mockRejectedValueOnce(new Error('Note with id note1 not found'));
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
      await getAllNotes(req, res);
      expect(notesService.getAllNotes).toHaveBeenCalledWith(mockUser.id);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ 
        total: 1, 
        notes: expect.any(Array) 
      }));
    });
    it('should handle error', async () => {
      (notesService.getAllNotes as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
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
      await createNote(req, res);
      expect(notesService.createNote).toHaveBeenCalledWith({ title: 'Test Note', content: 'Test Content' }, mockUser);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ id: 'note1' }), 201);
    });
    it('should handle missing title', async () => {
      req.body = { content: 'Test Content' };
      await createNote(req, res);
      expect(sendError).toHaveBeenCalledWith(req, res, 'Missing: title', 400);
    });
    it('should handle missing content', async () => {
      req.body = { title: 'Test Note' };
      await createNote(req, res);
      expect(sendError).toHaveBeenCalledWith(req, res, 'Missing: content', 400);
    });
    it('should handle error', async () => {
      req.body = { title: 'Test Note', content: 'Test Content' };
      (notesService.createNote as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
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
      const redlock = { acquire: jest.fn().mockResolvedValue({ release: jest.fn() }) };
      (updateNote as any).redlock = redlock;
      await updateNote(req, res);
      expect(notesService.updateNote).toHaveBeenCalledWith('note1', { title: 'Updated' }, mockUser);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ title: 'Updated' }));
    });
    it('should handle nothing to update', async () => {
      req.body = {};
      await updateNote(req, res);
      expect(sendError).toHaveBeenCalledWith(req, res, 'Nothing to update', 400);
    });
    it('should handle update error', async () => {
      req.params.id = 'note1';
      req.body = { title: 'Updated' };
      (notesService.updateNote as jest.Mock).mockRejectedValueOnce(new Error('Note with id note1 not found'));
      // Mock lock acquire/release
      const redlock = { acquire: jest.fn().mockResolvedValue({ release: jest.fn() }) };
      (updateNote as any).redlock = redlock;
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
      await deleteNote(req, res);
      expect(notesService.deleteNote).toHaveBeenCalledWith('note1', mockUser.id);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, { message: 'Note note1 deleted successfully' }, 204);
    });
    it('should handle error', async () => {
      req.params.id = 'note1';
      (notesService.deleteNote as jest.Mock).mockRejectedValueOnce(new Error('Note with id note1 not found'));
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
      await duplicateNote(req, res);
      expect(notesService.duplicateNote).toHaveBeenCalledWith('note1', mockUser);
      expect(sendSuccess).toHaveBeenCalledWith(req, res, expect.objectContaining({ 
        id: 'note2', 
        title: 'Test Note (Copy)' 
      }));
    });
    it('should handle error', async () => {
      req.params.id = 'note1';
      (notesService.duplicateNote as jest.Mock).mockRejectedValueOnce(new Error('Note with id note1 not found'));
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