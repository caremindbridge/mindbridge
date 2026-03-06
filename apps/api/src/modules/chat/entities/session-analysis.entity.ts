import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Session } from './session.entity';

@Entity('session_analyses')
export class SessionAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sessionId!: string;

  @OneToOne(() => Session, (session) => session.analysis, { onDelete: 'CASCADE' })
  @JoinColumn()
  session!: Session;

  // ── CBT fields ──────────────────────────────────────────────────────────────

  @Column({ type: 'jsonb', default: [] })
  cognitiveDistortions!: Array<{
    type: string;
    description: string;
    example: string;
    frequency: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  emotionalTrack!: Array<{
    moment: string;
    emotion: string;
    intensity: number;
    trigger: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  themes!: string[];

  @Column({ type: 'jsonb', default: [] })
  triggers!: string[];

  @Column({ type: 'text' })
  progressSummary!: string;

  @Column({ type: 'jsonb', default: [] })
  recommendations!: string[];

  @Column({ type: 'jsonb', nullable: true })
  homework!: string[] | null;

  @Column({ type: 'text' })
  therapistBrief!: string;

  // ── Dashboard metrics (nullable — old records remain valid) ─────────────────

  @Column({ type: 'smallint', nullable: true })
  anxietyLevel!: number | null;

  @Column({ type: 'smallint', nullable: true })
  depressionLevel!: number | null;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  keyEmotions!: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  keyTopics!: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  copingStrategies!: string[];

  @Column({ type: 'text', nullable: true })
  riskFlags!: string | null;

  @Column({ type: 'text', nullable: true })
  moodInsight!: string | null;

  @Column({ type: 'text', nullable: true })
  patientSummary!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
