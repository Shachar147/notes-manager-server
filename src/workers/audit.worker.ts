import * as amqp from 'amqplib';
import { AuditService } from '../features/audit/audit.service';
import { AuditTopic } from '../features/audit/audit.topics';
import { rabbitMQService } from '../services/rabbitmq.service';
import { AuditLogData } from '../features/audit/audit.types';
import { AppDataSource } from '../config/database';
import { asyncLocalStorage } from '../config/elasticsearch';
import logger from '../utils/logger';

class AuditWorker {
    private channel: amqp.Channel | null = null;
    private readonly exchangeName = 'notes_events';
    private readonly queueName = 'audit_logs_queue';
    private readonly auditService: AuditService;
    private readonly topicToHandler: Record<string, (data: any) => Promise<void>>;

    constructor() {
        this.auditService = new AuditService();
        this.topicToHandler = {
            [AuditTopic.NOTE_CREATED]: this.handleAuditEvent.bind(this),
            [AuditTopic.NOTE_UPDATED]: this.handleAuditEvent.bind(this),
            [AuditTopic.NOTE_DELETED]: this.handleAuditEvent.bind(this),
            [AuditTopic.NOTE_DUPLICATED]: this.handleAuditEvent.bind(this),
        };
    }

    async connect() {
        try {
            await rabbitMQService.connect();
            this.channel = rabbitMQService.getChannel();

            // Create queue
            await this.channel.assertQueue(this.queueName, {
                durable: true
            });

            // Bind queue to exchange with all audit event patterns
            const eventTypes = Object.values(AuditTopic);
            for (const eventType of eventTypes) {
                await this.channel.bindQueue(this.queueName, this.exchangeName, eventType);
            }

            console.log('Audit worker connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    async start() {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }

        try {
            await this.channel.consume(this.queueName, async (msg) => {
                if (msg) {
                    try {
                        const routingKey = msg.fields.routingKey;
                        const content = JSON.parse(msg.content.toString());
                        await this.handleMessage(routingKey, content);
                        this.channel?.ack(msg);
                    } catch (error) {
                        console.error('Error processing message:', error);
                        this.channel?.nack(msg, false, true);
                    }
                }
            });

            console.log(`
    _             _ _ _    __        __         _             
   / \\  _   _  __| (_) |_  \\ \\      / /__  _ __| | _____ _ __ 
  / _ \\| | | |/ _\` | | __|  \\ \\ /\\ / / _ \\| '__| |/ / _ \\ '__|
 / ___ \\ |_| | (_| | | |_    \\ V  V / (_) | |  |   <  __/ |   
/_/   \\_\\__,_|\\__,_|_|\\__|    \\_/\\_/ \\___/|_|  |_|\\_\\___|_|   

Notes Manager Audit Worker is running!
`);
        } catch (error) {
            console.error('Failed to start audit worker:', error);
            throw error;
        }
    }

    async handleMessage(topic: string, data: any) {
        const handler = this.topicToHandler[topic];
        if (handler) {
            await handler(data);
        } else {
            console.warn(`No handler for topic: ${topic}`);
        }
    }

    async handleAuditEvent(data: AuditLogData) {
        console.log("Receieved", {
            data
        })
        // Validation for required fields
        if (!data.eventType || !data.entityType || !data.entityId) {
            const logData = {
                eventType: data.eventType,
                entityType: data.entityType,
                entityId: data.entityId,
                userId: data.userId,
                data
            };
            console.error('Missing required audit log fields', logData);
            logger.error('Missing required audit log fields', logData);
            return; // Skip writing to DB
        }
        // Write to DB using AuditService
        await this.auditService.createAuditLog({
                eventType: data.eventType,
                entityType: data.entityType,
                entityId: data.entityId,
                userId: data.userId,
                oldData: data.oldData,
                newData: data.newData,
                metadata: data.metadata
        })
        logger.info(`Created audit log for ${data.entityType} ${data.entityId}`);
    }

    async close() {
        if (this.channel) {
            await this.channel.close();
        }
    }
}

// Start the worker and initialize DB connection
AppDataSource.initialize()
    .then(() => {
        console.log('Database connected successfully for Audit Worker');
        const worker = new AuditWorker();
        worker.connect()
            .then(() => worker.start())
            .catch(error => {
                console.error('Failed to start worker:', error);
                process.exit(1);
            });
    })
    .catch((error) => {
        console.error('TypeORM connection error in Audit Worker: ', error);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Closing worker...');
    // No need to close individual worker connection, rabbitMQService handles it
    await rabbitMQService.close(); // Ensure rabbitMQService connection is closed
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT. Closing worker...');
    await rabbitMQService.close(); // Ensure rabbitMQService connection is closed
    process.exit(0);
}); 