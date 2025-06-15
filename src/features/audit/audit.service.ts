import { AuditRepository } from './audit.repository';
import { AuditLog } from './audit.entity';
import { rabbitMQService } from '../../services/rabbitmq.service';
import { AuditTopic } from './audit.topics';
import { AuditLogData } from './audit.types';

export class AuditService {
    private auditRepository: AuditRepository;

    constructor() {
        this.auditRepository = new AuditRepository();
    }

    async createAuditLog(auditLog: Partial<AuditLog>): Promise<AuditLog> {
        return this.auditRepository.createAuditLog(auditLog);
    }

    async logEvent(
        eventType: AuditTopic,
        entityType: string,
        entityId: string,
        userId: string,
        oldData?: Record<string, any>,
        newData?: Record<string, any>,
        metadata?: Record<string, any>
    ): Promise<void> {
        // Only publish event to RabbitMQ
        const eventData: AuditLogData = {
            // auditLogId: 0, // Will be set by DB in worker
            eventType,
            entityType,
            entityId,
            userId,
            oldData,
            newData,
            metadata,
            timestamp: new Date()
        };
        await rabbitMQService.publishEvent(eventType, eventData);
    }

    async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
        return this.auditRepository.findByEntity(entityType, entityId);
    }

    async getEntityTypeHistory(entityType: string): Promise<AuditLog[]> {
        return this.auditRepository.findByEntityType(entityType);
    }

    async getEventHistory(eventType: AuditTopic): Promise<AuditLog[]> {
        return this.auditRepository.findByEventType(eventType);
    }

    async getDateRangeHistory(startDate: Date, endDate: Date): Promise<AuditLog[]> {
        return this.auditRepository.findByDateRange(startDate, endDate);
    }
} 