import { DataSource } from 'typeorm';
import { Note } from '../features/notes/notes.entity';
import {AuditLog} from "../features/audit/audit.entity";

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'postgres',
    password: 'postgres',
    database: 'notes_db',
    synchronize: true, // Only in development! <- means that once something changes in the code it updates db
    logging: false,
    entities: [Note, AuditLog],
    subscribers: [],
    migrations: [],
} as any);