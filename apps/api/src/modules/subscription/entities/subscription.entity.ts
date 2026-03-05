import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/user.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 30 })
  plan!: string;

  @Column({ type: 'varchar', length: 20, default: 'trial' })
  status!: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

  @Column({ type: 'int' })
  monthlyMessageLimit!: number;

  @Column({ type: 'int' })
  sessionMessageLimit!: number;

  @Column({ type: 'int', nullable: true })
  patientLimit!: number | null;

  @Column({ type: 'int', nullable: true })
  reportLimit!: number | null;

  @Column({ type: 'timestamptz' })
  currentPeriodStart!: Date;

  @Column({ type: 'timestamptz' })
  currentPeriodEnd!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  stripeCustomerId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripeSubscriptionId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
