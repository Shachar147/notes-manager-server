import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Note } from './notes.entity';

@Entity()
export class NoteEmbedding {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Note)
    @JoinColumn({ name: 'noteId' })
    note: Note;

    @Column()
    noteId: string;

    @Column('simple-json') // or 'vector' if supported by your DB
    embedding: number[];

    @CreateDateColumn()
    createdAt: Date;
} 