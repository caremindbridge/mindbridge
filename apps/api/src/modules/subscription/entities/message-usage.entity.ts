import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/user.entity';

@Entity('message_usage')
@Unique(['userId', 'periodStart'])
export class MessageUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int', default: 0 })
  messagesUsed!: number;

  @Column({ type: 'int', default: 0 })
  bonusMessagesRemaining!: number;

  @Column({ type: 'date' })
  periodStart!: Date;

  @Column({ type: 'date' })
  periodEnd!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  bonusExpiresAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  graceMessagesUsed!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
