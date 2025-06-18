"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_CONFIG = void 0;
exports.JWT_CONFIG = {
    SECRET: process.env.JWT_SECRET || 'your-secret-key',
    EXPIRES_IN: '24h'
};
