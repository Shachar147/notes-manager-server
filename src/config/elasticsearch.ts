import winston from "winston";
import {ElasticsearchTransport} from "winston-elasticsearch";
import { AsyncLocalStorage } from 'async_hooks';

export const ELASTICSEARCH_URL = "http://localhost:9200"

const esTransport = new ElasticsearchTransport({
    level: 'info',
    indexPrefix: 'app-logs',
    clientOpts: { node: ELASTICSEARCH_URL },
    ensureMappingTemplate: true,
});

interface Store {
    requestId?: string;
}

// Create AsyncLocalStorage to store request context
const asyncLocalStorage = new AsyncLocalStorage<Store>();

export const ELASTICSEARCH_CONFIG =
{
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(), // Important!
        winston.format.json(),
        winston.format((info) => {
            // Attach requestId from AsyncLocalStorage to every log
            const store = asyncLocalStorage.getStore();
            if (store?.requestId) {
                info.requestId = store.requestId;
            }
            return info;
        })()
    ),
    transports: [
        // new winston.transports.Console(),
        esTransport,
    ],
}

export {
    asyncLocalStorage
}