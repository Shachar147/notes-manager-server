"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const uuid_1 = require("uuid");
const elasticsearch_1 = require("../config/elasticsearch"); // path to your logger.ts
function requestIdMiddleware(req, res, next) {
    const requestId = (0, uuid_1.v4)();
    elasticsearch_1.asyncLocalStorage.run({ requestId }, () => {
        // Optionally add requestId to response headers
        res.setHeader('X-Request-Id', requestId);
        next();
    });
}
