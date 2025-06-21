import { EntityRepository, Repository } from 'typeorm';
import { NoteChatbotUsage } from './notes-chatbot-usage.entity';

@EntityRepository(NoteChatbotUsage)
export class NoteChatbotUsageRepository extends Repository<NoteChatbotUsage> {} 