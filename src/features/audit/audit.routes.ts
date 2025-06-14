import { Router } from 'express';
import { AuditController } from './audit.controller';

const router = Router();
const auditController = new AuditController();

// Get audit history for a specific entity
router.get('/entity/:entityType/:entityId', (req, res) => auditController.getEntityHistory(req, res));

// Get audit history for a specific event type
router.get('/event/:eventType', (req, res) => auditController.getEventHistory(req, res));

// Get audit history for a date range
router.get('/date-range', (req, res) => auditController.getDateRangeHistory(req, res));

export default router; 