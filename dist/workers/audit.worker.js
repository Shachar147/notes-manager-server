"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_service_1 = require("../features/audit/audit.service");
const audit_topics_1 = require("../features/audit/audit.topics");
const rabbitmq_service_1 = require("../services/rabbitmq.service");
const database_1 = require("../config/database");
class AuditWorker {
    constructor() {
        this.channel = null;
        this.exchangeName = 'notes_events';
        this.queueName = 'audit_logs_queue';
        this.auditService = new audit_service_1.AuditService();
        this.topicToHandler = {
            [audit_topics_1.AuditTopic.NOTE_CREATED]: this.handleAuditEvent.bind(this),
            [audit_topics_1.AuditTopic.NOTE_UPDATED]: this.handleAuditEvent.bind(this),
            [audit_topics_1.AuditTopic.NOTE_DELETED]: this.handleAuditEvent.bind(this),
            [audit_topics_1.AuditTopic.NOTE_DUPLICATED]: this.handleAuditEvent.bind(this),
        };
    }
    async connect() {
        try {
            await rabbitmq_service_1.rabbitMQService.connect();
            this.channel = rabbitmq_service_1.rabbitMQService.getChannel();
            // Create queue
            await this.channel.assertQueue(this.queueName, {
                durable: true
            });
            // Bind queue to exchange with all audit event patterns
            const eventTypes = Object.values(audit_topics_1.AuditTopic);
            for (const eventType of eventTypes) {
                await this.channel.bindQueue(this.queueName, this.exchangeName, eventType);
            }
            console.log('Audit worker connected to RabbitMQ');
        }
        catch (error) {
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
                    }
                    catch (error) {
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
        }
        catch (error) {
            console.error('Failed to start audit worker:', error);
            throw error;
        }
    }
    async handleMessage(topic, data) {
        const handler = this.topicToHandler[topic];
        if (handler) {
            await handler(data);
        }
        else {
            console.warn(`No handler for topic: ${topic}`);
        }
    }
    async handleAuditEvent(data) {
        console.log("Receieved", {
            data
        });
        // Write to DB using AuditService
        await this.auditService.createAuditLog({
            eventType: data.eventType,
            entityType: data.entityType,
            entityId: data.entityId,
            userId: data.userId,
            oldData: data.oldData,
            newData: data.newData,
            metadata: data.metadata
        });
    }
    async close() {
        if (this.channel) {
            await this.channel.close();
        }
    }
}
// Start the worker and initialize DB connection
database_1.AppDataSource.initialize()
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
    await rabbitmq_service_1.rabbitMQService.close(); // Ensure rabbitMQService connection is closed
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Closing worker...');
    await rabbitmq_service_1.rabbitMQService.close(); // Ensure rabbitMQService connection is closed
    process.exit(0);
});
