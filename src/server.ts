import 'reflect-metadata';
import { AppDataSource } from './config/database';
import app from './app';
import { rabbitMQService } from './services/rabbitmq.service';

const PORT = process.env.PORT || 3001;

AppDataSource.initialize()
    .then(async () => {
        console.log('Database connected successfully');
        await rabbitMQService.connect();

        app.listen(PORT, () => {
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
    await rabbitMQService.close();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);