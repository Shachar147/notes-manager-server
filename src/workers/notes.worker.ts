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
        };
    }

    async connect() {
        try {
            await rabbitMQService.connect();
            this.channel = rabbitMQService.getChannel();

            await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
            await this.channel.assertQueue(this.queueName, { durable: true });

            for (const topic of Object.values(NoteTopic)) {
                await this.channel.bindQueue(this.queueName, this.exchangeName, topic);
            }
            logger.info('Notes worker connected to RabbitMQ');
        } catch (error) {
            logger.error('Failed to connect to RabbitMQ for notes worker:', error);
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
    _             _ _ _    __        __         _             
   / \\  _   _  __| (_) |_  \\ \\      / /__  _ __| | _____ _ __ 
  / _ \\| | | |/ _\` | | __|  \\ \\ /\\ / / _ \\| '__| |/ / _ \\ '__|
 / ___ \\ |_| | (_| | | |_    \\ V  V / (_) | |  |   <  __/ |   
/_/   \\_\\__,_|\\__,_|_|\\__|    \\_/\\_/ \\___/|_|  |_|\\_\\___|_|   

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
            logger.warn(`No handler for topic in notes worker: ${topic}`);
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

async function main() {
    try {
        await AppDataSource.initialize();
        logger.info('Database connected successfully for Notes Worker');
        const worker = new NotesWorker();
        await worker.connect();
        await worker.start();
    } catch (error) {
        logger.error('Failed to initialize and start Notes Worker:', error);
        process.exit(1);
    }
}

main(); 