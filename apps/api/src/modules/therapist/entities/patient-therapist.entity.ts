import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from '../../users/user.entity';

@Entity('patient_therapist')
@Unique(['therapistId', 'patientId'])
export class PatientTherapist {
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

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'active' | 'inactive';

  @Column({ type: 'varchar', length: 8, nullable: true })
  inviteCode!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  connectedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
