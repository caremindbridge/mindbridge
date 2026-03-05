import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../users/user.entity';

export interface ReportContent {
  summary: string;
  moodTrend: string;
  keyThemes: string[];
  concerns: string[];
  copingStrategiesUsed: string[];
  progressNotes: string;
  suggestedFocus: string;
  riskFlags: string | null;
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  therapistId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'therapistId' })
  therapist!: User;

  @Column('uuid')
  patientId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient!: User;

  @Column({ type: 'varchar', length: 20, default: 'generating' })
  status!: 'generating' | 'ready' | 'error';

  @Column({ type: 'date' })
  periodStart!: Date;

  @Column({ type: 'date' })
  periodEnd!: Date;

  @Column({ type: 'jsonb', nullable: true })
  content!: ReportContent | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
