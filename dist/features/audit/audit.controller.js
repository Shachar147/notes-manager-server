"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const audit_service_1 = require("./audit.service");
const response_utils_1 = require("../../utils/response-utils");
class AuditController {
    constructor() {
        this.auditService = new audit_service_1.AuditService();
    }
    async getEntityHistory(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const history = await this.auditService.getEntityHistory(entityType, entityId);
            (0, response_utils_1.sendSuccess)(req, res, history);
        }
        catch (error) {
            (0, response_utils_1.sendError)(req, res, 'Failed to fetch entity history', 500, { errorMessage: error.message, exc_info: error.stack });
        }
    }
    async getEntityTypeHistory(req, res) {
        try {
            const { entityType } = req.params;
            const history = await this.auditService.getEntityTypeHistory(entityType);
            res.json(history);
        }
        catch (error) {
            (0, response_utils_1.sendError)(res, 'Failed to fetch entity history', 500, { errorMessage: error.message, exc_info: error.stack });
        }
    }
    async getEventHistory(req, res) {
        try {
            const { eventType } = req.params;
            const history = await this.auditService.getEventHistory(eventType);
            (0, response_utils_1.sendSuccess)(req, res, history);
        }
        catch (error) {
            (0, response_utils_1.sendError)(req, res, 'Failed to fetch event history', 500, { errorMessage: error.message, exc_info: error.stack });
        }
    }
    async getDateRangeHistory(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                (0, response_utils_1.sendError)(req, res, 'Missing required query parameters: startDate and endDate', 400);
                return;
            }
            const history = await this.auditService.getDateRangeHistory(new Date(startDate), new Date(endDate));
            (0, response_utils_1.sendSuccess)(req, res, history);
        }
        catch (error) {
            (0, response_utils_1.sendError)(req, res, 'Failed to fetch date range history', 500, { errorMessage: error.message, exc_info: error.stack });
        }
    }
}
exports.AuditController = AuditController;
