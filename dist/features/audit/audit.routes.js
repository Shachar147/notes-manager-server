"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("./audit.controller");
const router = (0, express_1.Router)();
const auditController = new audit_controller_1.AuditController();
// Get audit history for specific entity type - for example all Notes
router.get('/entity/:entityType', (req, res) => auditController.getEntityTypeHistory(req, res));
// Get audit history for a specific entity - for example all the history of specific note
router.get('/entity/:entityType/:entityId', (req, res) => auditController.getEntityHistory(req, res));
// Get audit history for a specific event type - for example all note.created events
router.get('/event/:eventType', (req, res) => auditController.getEventHistory(req, res));
// Get audit history for a date range - for example all the history between 06-01-2025 to 06-30-2025 - startDate=06-01-2025&endDate=06-30-2025
router.get('/date-range', (req, res) => auditController.getDateRangeHistory(req, res));
exports.default = router;
