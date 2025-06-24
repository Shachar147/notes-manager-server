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

      console.log("looking for relevant notes");

      // Find relevant notes
      const notes = await notesChatService.findRelevantNotes(question, 3);
      
      console.log(`found ${notes.length} notes!`);

      // Generate answer using Ollama
      const answer = await notesChatService.generateChatResponse(question, notes);

      // Track usage for analytics (concurrently)
      await Promise.all(notes.map(note => usageService.recordUsage(note.id, question, userId)));
      // Return answer and links to notes
      res.json({
        answer,
        notes: notes.map(n => ({ id: n.id, title: n.title })),
      });
    } catch (err) {
        console.error(err);
        logger.error('Error in /api/notes/chat:', { message: (err as Error).message, stack: (err as Error).stack });
        res.status(500).json({ error: 'Internal server error' });
    }
  };
} 