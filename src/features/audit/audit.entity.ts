import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50 })
    eventType: string;

    @Column({ length: 50 })
    entityType: string;

    @Column({ length: 50 })
    entityId: string;

    @Column({ length: 50, nullable: true })
    userId: string;

    @Column({ type: 'jsonb', nullable: true })
    oldData: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    newData: Record<string, any>;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
} 