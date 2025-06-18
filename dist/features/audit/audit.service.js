"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const audit_repository_1 = require("./audit.repository");
const rabbitmq_service_1 = require("../../services/rabbitmq.service");
class AuditService {
    constructor() {
        this.auditRepository = new audit_repository_1.AuditRepository();
    }
    async createAuditLog(auditLog) {
        return this.auditRepository.createAuditLog(auditLog);
    }
    async logEvent(eventType, entityType, entityId, userId, oldData, newData, metadata) {
        // Only publish event to RabbitMQ
        const eventData = {
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
        await rabbitmq_service_1.rabbitMQService.publishEvent(eventType, eventData);
    }
    async getEntityHistory(entityType, entityId) {
        return this.auditRepository.findByEntity(entityType, entityId);
    }
    async getEntityTypeHistory(entityType) {
        return this.auditRepository.findByEntityType(entityType);
    }
    async getEventHistory(eventType) {
        return this.auditRepository.findByEventType(eventType);
    }
    async getDateRangeHistory(startDate, endDate) {
        return this.auditRepository.findByDateRange(startDate, endDate);
    }
}
exports.AuditService = AuditService;
