import request from 'supertest';
import express from 'express';
import { createHandleChat } from '../notes-chat.controller';

// Mock services
const mockFindRelevantNotes = jest.fn();
const mockGenerateChatResponse = jest.fn();
const mockRecordUsage = jest.fn();

const mockNotesChatService = {
  findRelevantNotes: mockFindRelevantNotes,
  generateChatResponse: mockGenerateChatResponse,
};
const mockUsageService = {
  recordUsage: mockRecordUsage,
};

const app = express();
app.use(express.json());
app.post('/api/chat', createHandleChat(
  mockNotesChatService as any,
  mockUsageService as any
));

describe('POST /api/chat', () => {
  beforeEach(() => {
    mockFindRelevantNotes.mockReset();
    mockGenerateChatResponse.mockReset();
    mockRecordUsage.mockReset();
  });

  it('returns 400 if question is missing', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing question');
  });

  it('returns answer and notes for a valid question', async () => {
    mockFindRelevantNotes.mockResolvedValue([
      { id: '1', title: 'Note 1' },
      { id: '2', title: 'Note 2' },
    ]);
    mockGenerateChatResponse.mockResolvedValue('This is a test answer.');
    const res = await request(app).post('/api/chat').send({ question: 'How do I set up Express?' });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBe('This is a test answer.');
    expect(res.body.notes.length).toBe(2);
    expect(mockRecordUsage).toHaveBeenCalledTimes(2);
  });

  it('handles errors and logs them', async () => {
    mockFindRelevantNotes.mockRejectedValue(new Error('fail'));
    mockGenerateChatResponse.mockResolvedValue('This should not be called');
    const res = await request(app).post('/api/chat').send({ question: 'fail' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
}); 