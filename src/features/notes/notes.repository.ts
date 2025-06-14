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

    async findAll(): Promise<Note[]> {
        return await this.repository.find();
    }

    async findById(id: string): Promise<Note | null> {
        return await this.repository.findOneBy({ id });
    }

    async update(id: string, note: Partial<Note>): Promise<Note | null> {
        await this.repository.update(id, note);
        return await this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}