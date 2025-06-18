"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const notes_routes_1 = __importDefault(require("./features/notes/notes.routes"));
const audit_routes_1 = __importDefault(require("./features/audit/audit.routes"));
const auth_routes_1 = __importDefault(require("./features/auth/auth.routes"));
const request_id_middleware_1 = require("./middlewares/request-id.middleware");
const elastic_logger_middleware_1 = require("./middlewares/elastic-logger.middleware");
const auth_middleware_1 = require("./features/auth/auth.middleware");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(request_id_middleware_1.requestIdMiddleware);
app.use(elastic_logger_middleware_1.elasticLoggerMiddleware); // Request logging middleware
// Public routes
app.use('/auth', auth_routes_1.default);
// Protected routes
app.use('/notes', auth_middleware_1.authMiddleware, notes_routes_1.default);
app.use('/audit', auth_middleware_1.authMiddleware, audit_routes_1.default);
exports.default = app;
