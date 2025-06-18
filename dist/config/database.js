"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const notes_entity_1 = require("../features/notes/notes.entity");
const audit_entity_1 = require("../features/audit/audit.entity");
const user_entity_1 = require("../features/auth/user.entity");
const options = {
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'postgres',
    password: 'postgres',
    database: 'notes_db',
    synchronize: true, // Only in development! <- means that once something changes in the code it updates db
    logging: false,
    entities: [notes_entity_1.Note, audit_entity_1.AuditLog, user_entity_1.User],
    subscribers: [],
    migrations: ['src/migrations/*.ts'], // Add migrations path
    migrationsTableName: 'migrations', // Migration table name
};
exports.AppDataSource = new typeorm_1.DataSource(options);
