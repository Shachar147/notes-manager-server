"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitMQService = exports.RabbitMQService = void 0;
const amqp = __importStar(require("amqplib"));
const rabbitmq_1 = require("../config/rabbitmq");
class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchangeName = 'notes_events';
        this.exchangeType = 'topic';
    }
    async connect() {
        try {
            this.connection = await amqp.connect(rabbitmq_1.RABBITMQ_CONFIG.url);
            this.channel = await this.connection.createChannel();
            // Create exchange
            await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
                durable: true
            });
            console.log('Connected to RabbitMQ');
        }
        catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }
    getChannel() {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }
        return this.channel;
    }
    async publishEvent(routingKey, data) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }
        try {
            const message = Buffer.from(JSON.stringify(data));
            this.channel.publish(this.exchangeName, routingKey, message, {
                persistent: true
            });
        }
        catch (error) {
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
exports.RabbitMQService = RabbitMQService;
exports.rabbitMQService = new RabbitMQService();
