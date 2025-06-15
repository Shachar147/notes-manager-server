import * as amqp from 'amqplib';
import { RABBITMQ_CONFIG } from '../config/rabbitmq';

export class RabbitMQService {
    private connection: amqp.ChannelModel | null = null;
    private channel: amqp.Channel | null = null;
    private readonly exchangeName = 'notes_events';
    private readonly exchangeType = 'topic';

    async connect() {
        try {
            this.connection = await amqp.connect(RABBITMQ_CONFIG.url);
            this.channel = await this.connection.createChannel();
            
            // Create exchange
            await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
                durable: true
            });

            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    getChannel(): amqp.Channel {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }
        return this.channel;
    }

    async publishEvent(routingKey: string, data: any) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }

        try {
            const message = Buffer.from(JSON.stringify(data));
            this.channel.publish(this.exchangeName, routingKey, message, {
                persistent: true
            });
        } catch (error) {
            console.error('Failed to publish event:', error);
            throw error;
        }
    }

    async close() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
    }
}

export const rabbitMQService = new RabbitMQService(); 