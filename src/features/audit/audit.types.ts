import { AuditTopic } from './audit.topics';

export interface AuditLogData {
    // auditLogId: number;
    eventType: AuditTopic;
    entityType: string;
    entityId: string;
    userId: string;
    oldData?: Record<string, any>;
    newData?: Record<string, any>;
    metadata?: Record<string, any>;
    timestamp: Date;
} 