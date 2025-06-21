import { Request, Response } from 'express';
import { NotesChatService } from './notes-chat.service';
import { NoteChatbotUsageService } from './notes-chatbot-usage.service';
import logger from '../../utils/logger';

export function createHandleChat(notesChatService: NotesChatService, usageService: NoteChatbotUsageService) {
  return async function handleChat(req: Request, res: Response) {
    try {
      const { question, userId } = req.body;
      if (!question) {
        return res.status(400).json({ error: 'Missing question' });
      }
      // Find relevant notes
      const notes = await notesChatService.findRelevantNotes(question, 3);
      console.log("hereee", question);
      // TODO: Generate answer using Ollama (stub for now)
      const answer = 'This is a placeholder answer. (Ollama integration needed)';
      // Track usage for analytics (concurrently)
      await Promise.all(notes.map(note => usageService.recordUsage(note.id, question, userId)));
      // Return answer and links to notes
      res.json({
        answer,
        notes: notes.map(n => ({ id: n.id, title: n.title })),
      });
    } catch (err) {
      logger.error('Error in /api/notes/chat:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
} 