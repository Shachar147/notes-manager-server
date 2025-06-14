export enum AuditEventType {
    NOTE_CREATED = 'note.created',
    NOTE_UPDATED = 'note.updated',
    NOTE_DELETED = 'note.deleted',
    NOTE_DUPLICATED = 'note.duplicated'
}

export interface AuditLogData {
    auditLogId: number;
    eventType: AuditEventType;
    entityType: string;
    entityId: string;
    userId: string;
    oldData?: Record<string, any>;
    newData?: Record<string, any>;
    metadata?: Record<string, any>;
    timestamp: Date;
} 