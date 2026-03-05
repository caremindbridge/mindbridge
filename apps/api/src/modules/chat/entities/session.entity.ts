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

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: SessionStatusEnum, default: SessionStatusEnum.Active })
  status!: SessionStatusEnum;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => Message, (message) => message.session, { cascade: true })
  messages!: Message[];

  @OneToOne(() => SessionAnalysis, (analysis) => analysis.session, { cascade: true })
  analysis!: SessionAnalysis;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt!: Date | null;
}
