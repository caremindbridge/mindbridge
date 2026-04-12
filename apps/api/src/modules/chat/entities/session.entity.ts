import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/user.entity';
import { Message } from './message.entity';
import { SessionAnalysis } from './session-analysis.entity';

export enum SessionStatusEnum {
  Active = 'active',
  Ended = 'ended',
  Analyzing = 'analyzing',
  Completed = 'completed',
}

export enum SessionCategoryEnum {
  CBT = 'cbt',
  Interpersonal = 'interpersonal',
  Mindfulness = 'mindfulness',
  Wellness = 'wellness',
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: SessionStatusEnum, default: SessionStatusEnum.Active })
  status!: SessionStatusEnum;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @Column({ type: 'enum', enum: SessionCategoryEnum, nullable: true })
  category!: SessionCategoryEnum | null;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => Message, (message) => message.session, { cascade: true })
  messages!: Message[];

  @OneToOne(() => SessionAnalysis, (analysis) => analysis.session, { cascade: true })
  analysis!: SessionAnalysis;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt!: Date | null;
}
