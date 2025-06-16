import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { AuditTopic } from './audit.topics';
import { sendSuccess, sendError } from '../../utils/response-utils';

export class AuditController {
    private auditService: AuditService;

    constructor() {
        this.auditService = new AuditService();
    }

    async getEntityHistory(req: Request, res: Response) {
        try {
            const { entityType, entityId } = req.params;
            const history = await this.auditService.getEntityHistory(entityType, entityId);
            sendSuccess(req, res, history);
        } catch (error: any) {
            sendError(req, res, 'Failed to fetch entity history', 500, { errorMessage: error.message, exc_info: error.stack });
        }
    }

    async getEntityTypeHistory(req: Request, res: Response) {
        try {
            const { entityType } = req.params;
            const history = await this.auditService.getEntityTypeHistory(entityType);
            res.json(history);
        } catch (error) {
            sendError(res, 'Failed to fetch entity history', 500, { errorMessage: error.message, exc_info: error.stack })
        }
    }

    async getEventHistory(req: Request, res: Response) {
        try {
            const { eventType } = req.params;
            const history = await this.auditService.getEventHistory(eventType as AuditTopic);
            sendSuccess(req, res, history);
        } catch (error: any) {
            sendError(req, res, 'Failed to fetch event history', 500, { errorMessage: error.message, exc_info: error.stack });
        }
    }

    async getDateRangeHistory(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                sendError(req, res, 'Missing required query parameters: startDate and endDate', 400);
                return;
            }

            const history = await this.auditService.getDateRangeHistory(
                new Date(startDate as string),
                new Date(endDate as string)
            );
            sendSuccess(req, res, history);
        } catch (error: any) {
            sendError(req, res, 'Failed to fetch date range history', 500, { errorMessage: error.message, exc_info: error.stack });
        }
    }
} 