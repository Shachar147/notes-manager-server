import { DataSource, DataSourceOptions } from 'typeorm';
import { Note } from '../features/notes/notes.entity';
import { AuditLog } from "../features/audit/audit.entity";
import { User } from '../features/auth/user.entity';

const options: DataSourceOptions = {
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'postgres',
    password: 'postgres',
    database: 'notes_db',
    synchronize: true, // Only in development! <- means that once something changes in the code it updates db
    logging: false,
    entities: [Note, AuditLog, User],
    subscribers: [],
    migrations: ['src/migrations/*.ts'], // Add migrations path
    migrationsTableName: 'migrations', // Migration table name
};

export const AppDataSource = new DataSource(options);