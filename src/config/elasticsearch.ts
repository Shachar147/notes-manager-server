import winston from "winston";
import {ElasticsearchTransport} from "winston-elasticsearch";

export const ELASTICSEARCH_URL = "http://localhost:9200"

const esTransport = new ElasticsearchTransport({
    level: 'info',
    indexPrefix: 'app-logs',
    clientOpts: { node: ELASTICSEARCH_URL },
    ensureMappingTemplate: true,
});

export const ELASTICSEARCH_CONFIG =
{
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(), // Important!
        winston.format.json()
    ),
    transports: [
        // new winston.transports.Console(),
        esTransport,
    ],
}