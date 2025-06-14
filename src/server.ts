import 'reflect-metadata';
import { AppDataSource } from './config/database';
import app from './app';

const PORT = process.env.PORT || 3001;

AppDataSource.initialize()
    .then(() => {
        console.log('Database connected successfully');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => console.log('TypeORM connection error: ', error));