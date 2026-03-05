import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface PatientContextData {
  name?: string;
  age?: number;
  pronouns?: string;
  medications?: string;
  diagnoses?: string;
  previousTherapy?: string;
  occupation?: string;
  relationships?: string;
  livingSituation?: string;
  goals?: string;
  additionalNotes?: string;
  updatedAt?: string;
}

@Entity('patient_profiles')
export class PatientProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { unique: true })
  userId!: string;

  @Column('text')
  content!: string;

  @Column('text', { nullable: true })
  therapistNotes!: string | null;

  @Column('jsonb', { nullable: true })
  patientContext!: PatientContextData | null;

  @Column('int', { default: 0 })
  sessionsIncorporated!: number;

  @Column('int', { default: 0 })
  version!: number;

  @UpdateDateColumn()
  updatedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
