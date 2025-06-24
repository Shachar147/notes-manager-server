import 'reflect-metadata';
import * as amqp from 'amqplib';
import { AppDataSource } from '../config/database';
import { rabbitMQService } from '../services/rabbitmq.service';
import { NoteEmbeddingService } from '../features/notes/notes.embedding.service';
import { NoteEmbeddingRepository } from '../features/notes/notes.embedding.repository';
import { Note } from '../features/notes/notes.entity';
import { NoteTopic } from '../features/notes/notes.topics';
import logger from '../utils/logger';
import { NoteEmbedding } from '../features/notes/notes.embedding.entity';

class NotesWorker {
    private channel: amqp.Channel | null = null;
    private readonly exchangeName = 'notes_events';
    private readonly queueName = 'notes_embedding_queue';
    private embeddingService: NoteEmbeddingService;
    private readonly topicToHandler: Record<string, (data: any) => Promise<void>>;

    constructor() {
        const noteEmbeddingRepository = new NoteEmbeddingRepository(NoteEmbedding, AppDataSource.manager);
        this.embeddingService = new NoteEmbeddingService(noteEmbeddingRepository);
        this.topicToHandler = {
            [NoteTopic.NOTE_CREATED]: this.handleEmbeddingEvent.bind(this),
            [NoteTopic.NOTE_UPDATED]: this.handleEmbeddingEvent.bind(this),
            [NoteTopic.NOTE_DUPLICATED]: this.handleEmbeddingEvent.bind(this),
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
            const eventTypes = Object.values(NoteTopic);
            for (const eventType of eventTypes) {
                await this.channel.bindQueue(this.queueName, this.exchangeName, eventType);
            }

            console.log(`
                                                                   
            Notes Manager Notes Worker is running!
            `);        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    async start() {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized for notes worker');
        }

        try {
            this.channel.consume(this.queueName, async (msg) => {
                if (msg) {
                    console.log("got hereee");
                    try {
                        const routingKey = msg.fields.routingKey;
                        const content = JSON.parse(msg.content.toString());
                        await this.handleMessage(routingKey, content);
                        this.channel?.ack(msg);
                    } catch (error) {
                        logger.error('Error processing message in notes worker:', error);
                        this.channel?.nack(msg, false, true); // Requeue the message on failure
                    }
                }
            });
            logger.info(`
            Notes Manager Notes Worker is running!
`);
        } catch (error) {
            logger.error('Failed to start notes worker:', error);
            throw error;
        }
    }

    private async handleMessage(topic: string, data: any) {
        console.log(`Got event ${topic}`)
        const handler = this.topicToHandler[topic];
        if (handler) {
            await handler(data);
        } else {
            console.warn(`No handler for topic in notes worker: ${topic}`);
        }
    }

    private async handleEmbeddingEvent(note: Note) {
        try {
            console.log('Processing embedding for note: ${note.id} for event.');
            logger.info(`Processing embedding for note: ${note.id} for event.`);
            const text = `${note.title}\n${note.content}`;
            const embedding = await this.embeddingService.generateEmbedding(text);
            await this.embeddingService.createOrUpdateEmbedding(note.id, embedding);
            console.log(`Successfully processed embedding for note: ${note.id}`);
            logger.info(`Successfully processed embedding for note: ${note.id}`);
        } catch (error) {
            console.error(`Failed to process embedding for note ${note.id}:`, error);
            logger.error(`Failed to process embedding for note ${note.id}:`, error);
            // We re-throw the error so the message can be nack'd and requeued
            throw error;
        }
    }
}

// Start the worker and initialize DB connection
AppDataSource.initialize()
    .then(() => {
        console.log('Database connected successfully for Audit Worker');
        const worker = new NotesWorker();
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