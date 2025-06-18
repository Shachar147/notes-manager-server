"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("./config/database");
const app_1 = __importDefault(require("./app"));
const rabbitmq_service_1 = require("./services/rabbitmq.service");
const PORT = process.env.PORT || 3001;
database_1.AppDataSource.initialize()
    .then(async () => {
    console.log('Database connected successfully');
    await rabbitmq_service_1.rabbitMQService.connect();
    app_1.default.listen(PORT, () => {
        console.log(`
 ____                           
/ ___|  ___ _ ____   _____ _ __ 
\\___ \\ / _ \\ '__\\ \\ / / _ \\ '__|
 ___) |  __/ |   \\ V /  __/ |   
|____/ \\___|_|    \\_/ \\___|_|    

Notes Manager SERVER is running on http://localhost:${PORT}
`);
    });
})
    .catch((error) => console.log('TypeORM connection error: ', error));
// Graceful shutdown for RabbitMQ
const shutdown = async () => {
    await rabbitmq_service_1.rabbitMQService.close();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
