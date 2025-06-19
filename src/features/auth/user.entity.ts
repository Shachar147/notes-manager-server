import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Note } from '../notes/notes.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })  // if google login, it's nullable.
    password: string;

    @Column({ nullable: true })  // if google login, it's nullable.
    salt: string;

    @OneToMany(() => Note, note => note.user)
    notes: Note[];

    @Column({ nullable: true })
    googleId?: string;
  
    @Column({ nullable: true })
    profilePicture?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 