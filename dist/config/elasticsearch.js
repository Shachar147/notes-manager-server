"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncLocalStorage = exports.ELASTICSEARCH_CONFIG = exports.ELASTICSEARCH_URL = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_elasticsearch_1 = require("winston-elasticsearch");
const async_hooks_1 = require("async_hooks");
exports.ELASTICSEARCH_URL = "http://localhost:9200";
const esTransport = new winston_elasticsearch_1.ElasticsearchTransport({
    level: 'info',
    indexPrefix: 'app-logs',
    clientOpts: { node: exports.ELASTICSEARCH_URL },
    ensureMappingTemplate: true,
});
// Create AsyncLocalStorage to store request context
const asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
exports.asyncLocalStorage = asyncLocalStorage;
exports.ELASTICSEARCH_CONFIG = {
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), // Important!
    winston_1.default.format.json(), winston_1.default.format((info) => {
        // Attach requestId from AsyncLocalStorage to every log
        const store = asyncLocalStorage.getStore();
        if (store?.requestId) {
            info.requestId = store.requestId;
        }
        return info;
    })()),
    transports: [
        // new winston.transports.Console(),
        esTransport,
    ],
};
