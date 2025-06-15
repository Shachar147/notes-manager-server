import { Repository, Between } from 'typeorm';
import { AuditLog } from './audit.entity';
import { AppDataSource } from '../../config/database';

export class AuditRepository {
    private repository: Repository<AuditLog>;

    constructor() {
        this.repository = AppDataSource.getRepository(AuditLog);
    }

    async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
        return this.repository.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' }
        });
    }

    async findByEntityType(entityType: string): Promise<AuditLog[]> {
        return this.repository.find({
            where: { entityType },
            order: { createdAt: 'DESC' }
        });
    }

    async findByEventType(eventType: string): Promise<AuditLog[]> {
        return this.repository.find({
            where: { eventType },
            order: { createdAt: 'DESC' }
        });
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
        return this.repository.find({
            where: {
                createdAt: Between(startDate, endDate)
            },
            order: { createdAt: 'DESC' }
        });
    }

    async createAuditLog(auditLog: Partial<AuditLog>): Promise<AuditLog> {
        const newAuditLog = this.repository.create(auditLog);
        return this.repository.save(newAuditLog);
    }
} 