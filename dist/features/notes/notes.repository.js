"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteRepository = void 0;
const database_1 = require("../../config/database");
const notes_entity_1 = require("./notes.entity");
class NoteRepository {
    constructor() {
        this.repository = database_1.AppDataSource.getRepository(notes_entity_1.Note);
    }
    async create(note, user) {
        note.user = user;
        note.userId = user.id;
        const newNote = this.repository.create(note);
        return await this.repository.save(newNote);
    }
    async findAll(userId) {
        return await this.repository.find({
            where: { userId },
            order: { updatedAt: 'DESC' }
        });
    }
    async findById(id, userId) {
        return await this.repository.findOneBy({ id, userId });
    }
    async update(id, note, user) {
        await this.repository.update({ id, userId: user.id, user }, note);
        return await this.findById(id, user.id);
    }
    async delete(id, userId) {
        await this.repository.delete({ id, userId });
    }
    async count(userId) {
        return await this.repository.count({
            where: { userId }
        });
    }
}
exports.NoteRepository = NoteRepository;
