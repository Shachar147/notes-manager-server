import { NoteChatbotUsage } from './notes-chatbot-usage.entity';
import { NoteChatbotUsageRepository } from './notes-chatbot-usage.repository';

export class NoteChatbotUsageService {
  private readonly usageRepo: NoteChatbotUsageRepository;

  constructor(usageRepo: NoteChatbotUsageRepository) {
    this.usageRepo = usageRepo;
  }

  async recordUsage(noteId: string, question: string, userId?: string): Promise<NoteChatbotUsage> {
    const usage = this.usageRepo.create({ noteId, question, userId });
    return this.usageRepo.save(usage);
  }

  async getUsageCount(noteId: string): Promise<number> {
    return this.usageRepo.count({ where: { noteId } });
  }

  async deleteByNoteId(noteId: string): Promise<void> {
    await this.usageRepo.delete({ noteId });
  }
} 