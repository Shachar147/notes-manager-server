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

  async getUsageStatistics(): Promise<{ title: string; noteId: string; total: number }[]> {
    const result = await this.usageRepo
      .createQueryBuilder('u')
      .select('n.title', 'title')
      .addSelect('u.noteId', 'noteId')
      .addSelect('COUNT(*)', 'total')
      .innerJoin('note', 'n', 'n.id = u.noteId')
      .groupBy('n.title')
      .addGroupBy('u.noteId')
      .orderBy('total', 'DESC')
      .getRawMany();
    // Convert total from string to number
    return result.map((row: any) => ({ ...row, total: Number(row.total) }));
  }
} 