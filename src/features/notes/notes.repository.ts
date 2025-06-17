import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Note } from './notes.entity';

export class NoteRepository {
    private repository: Repository<Note>;

    constructor() {
        this.repository = AppDataSource.getRepository(Note);
    }

    async create(note: Partial<Note>): Promise<Note> {
        const newNote = this.repository.create(note);
        return await this.repository.save(newNote);
    }

    async findAll(userId: string): Promise<Note[]> {
        return await this.repository.find({
            where: { userId },
            order: { updatedAt: 'DESC' }
        });
    }

    async findById(id: string, userId: string): Promise<Note | null> {
        return await this.repository.findOneBy({ id, userId });
    }

    async update(id: string, note: Partial<Note>, userId: string): Promise<Note | null> {
        await this.repository.update({ id, userId }, note);
        return await this.findById(id, userId);
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.repository.delete({ id, userId });
    }
}