import { AuditRepository } from './audit.repository';
import { AuditLog } from './audit.entity';
import { rabbitMQService } from '../../services/rabbitmq.service';
import { AuditEventType, AuditLogData } from './audit.types';

export class AuditService {
    private auditRepository: AuditRepository;

    constructor() {
        this.auditRepository = new AuditRepository();
    }

    async logEvent(
        eventType: AuditEventType,
        entityType: string,
        entityId: string,
        userId: string,
        oldData?: Record<string, any>,
        newData?: Record<string, any>,
        metadata?: Record<string, any>
    ): Promise<AuditLog> {
        // Create audit log in database
        const auditLog = await this.auditRepository.createAuditLog({
            eventType,
            entityType,
            entityId,
            userId,
            oldData,
            newData,
            metadata
        });

        // Publish event to RabbitMQ
        const eventData: AuditLogData = {
            auditLogId: auditLog.id,
            eventType,
            entityType,
            entityId,
            userId,
            oldData,
            newData,
            metadata,
            timestamp: auditLog.createdAt
        };

        await rabbitMQService.publishEvent(eventType, eventData);

        return auditLog;
    }

    async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
        return this.auditRepository.findByEntity(entityType, entityId);
    }

    async getEntityTypeHistory(entityType: string): Promise<AuditLog[]> {
        return this.auditRepository.findByEntityType(entityType);
    }

    async getEventHistory(eventType: AuditEventType): Promise<AuditLog[]> {
        return this.auditRepository.findByEventType(eventType);
    }

    async getDateRangeHistory(startDate: Date, endDate: Date): Promise<AuditLog[]> {
        return this.auditRepository.findByDateRange(startDate, endDate);
    }
} 