import * as amqp from 'amqplib';
import { AuditService } from '../features/audit/audit.service';
import { AuditTopic } from '../features/audit/audit.topics';
import { rabbitMQService } from '../services/rabbitmq.service';

class AuditWorker {
    private channel: amqp.Channel | null = null;
    private readonly exchangeName = 'notes_events';
    private readonly queueName = 'audit_logs_queue';
    private readonly auditService: AuditService;

    constructor() {
        this.auditService = new AuditService();
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
                        const content = JSON.parse(msg.content.toString());
                        console.log('Received audit event:', content);

                        // Process the event (you can add additional processing here)
                        // For now, we're just logging it since the audit log is already created
                        // when the event is published

                        this.channel?.ack(msg);
                    } catch (error) {
                        console.error('Error processing message:', error);
                        // Reject the message and requeue it
                        this.channel?.nack(msg, false, true);
                    }
                }
            });

            console.log('Audit worker started');
        } catch (error) {
            console.error('Failed to start audit worker:', error);
            throw error;
        }
    }

    async close() {
        if (this.channel) {
            await this.channel.close();
        }
    }
}

// Start the worker
const worker = new AuditWorker();
worker.connect()
    .then(() => worker.start())
    .catch(error => {
        console.error('Failed to start worker:', error);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Closing worker...');
    await worker.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT. Closing worker...');
    await worker.close();
    process.exit(0);
}); 