// Workaround for CommonJS + Node 18
// @ts-ignore
if (typeof ReadableStream === 'undefined') {
    // Node >=18 supports this natively
    global.ReadableStream = require('stream/web').ReadableStream;
}


import winston from 'winston';
import {ELASTICSEARCH_CONFIG} from "../config/elasticsearch";

const logger = winston.createLogger(ELASTICSEARCH_CONFIG);

export default logger;