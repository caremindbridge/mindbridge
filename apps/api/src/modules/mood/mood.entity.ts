import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Session } from '../chat/entities/session.entity';
import { User } from '../users/user.entity';

@Entity('moods')
export class Mood {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('smallint')
  value!: number; // 1–10

  @Column({ type: 'jsonb', default: [] })
  emotions!: string[];

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'uuid', nullable: true })
  sessionId!: string | null;

  @ManyToOne(() => Session, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sessionId' })
  session!: Session | null;

  @CreateDateColumn()
  createdAt!: Date;
}
