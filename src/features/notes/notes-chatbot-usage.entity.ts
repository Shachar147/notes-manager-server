import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Note } from './notes.entity';
import { User } from '../auth/user.entity';

@Entity()
export class NoteChatbotUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Note)
    @JoinColumn({ name: 'noteId' })
    note: Note;

    @Column()
    noteId: string;

    @Column('text')
    question: string;

    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    userId: string;
} 