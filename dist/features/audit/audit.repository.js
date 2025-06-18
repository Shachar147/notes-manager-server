"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const typeorm_1 = require("typeorm");
const audit_entity_1 = require("./audit.entity");
const database_1 = require("../../config/database");
class AuditRepository {
    constructor() {
        this.repository = database_1.AppDataSource.getRepository(audit_entity_1.AuditLog);
    }
    async findByEntity(entityType, entityId) {
        return this.repository.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' }
        });
    }
    async findByEntityType(entityType) {
        return this.repository.find({
            where: { entityType },
            order: { createdAt: 'DESC' }
        });
    }
    async findByEventType(eventType) {
        return this.repository.find({
            where: { eventType },
            order: { createdAt: 'DESC' }
        });
    }
    async findByDateRange(startDate, endDate) {
        return this.repository.find({
            where: {
                createdAt: (0, typeorm_1.Between)(startDate, endDate)
            },
            order: { createdAt: 'DESC' }
        });
    }
    async createAuditLog(auditLog) {
        const newAuditLog = this.repository.create(auditLog);
        return this.repository.save(newAuditLog);
    }
}
exports.AuditRepository = AuditRepository;
