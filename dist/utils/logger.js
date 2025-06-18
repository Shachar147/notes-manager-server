"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Workaround for CommonJS + Node 18
// @ts-ignore
if (typeof ReadableStream === 'undefined') {
    // Node >=18 supports this natively
    global.ReadableStream = require('stream/web').ReadableStream;
}
const winston_1 = __importDefault(require("winston"));
const elasticsearch_1 = require("../config/elasticsearch");
const logger = winston_1.default.createLogger(elasticsearch_1.ELASTICSEARCH_CONFIG);
exports.default = logger;
