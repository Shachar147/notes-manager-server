import { Router } from 'express';
import { createHandleChat } from './notes-chat.controller';
import { NotesChatService } from './notes-chat.service';
import { NoteChatbotUsageService } from './notes-chatbot-usage.service';

export function createChatRouter(notesChatService: NotesChatService, usageService: NoteChatbotUsageService) {
  const router = Router();
  router.post('/', createHandleChat(notesChatService, usageService));
  return router;
} 