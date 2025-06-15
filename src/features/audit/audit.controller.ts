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
            sendSuccess(res, history);
        } catch (error) {
            sendError(res, 'Failed to fetch entity history', 500);
        }
    }

    async getEntityTypeHistory(req: Request, res: Response) {
        try {
            const { entityType } = req.params;
            const history = await this.auditService.getEntityTypeHistory(entityType);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch entity history' });
        }
    }

    async getEventHistory(req: Request, res: Response) {
        try {
            const { eventType } = req.params;
            const history = await this.auditService.getEventHistory(eventType as AuditTopic);
            sendSuccess(res, history);
        } catch (error) {
            sendError(res, 'Failed to fetch event history', 500);
        }
    }

    async getDateRangeHistory(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                res.status(400).json({ error: 'Start date and end date are required' });
                return;
            }

            const history = await this.auditService.getDateRangeHistory(
                new Date(startDate as string),
                new Date(endDate as string)
            );
            sendSuccess(res, history);
        } catch (error) {
            sendError(res, 'Failed to fetch date range history', 500);
        }
    }
} 