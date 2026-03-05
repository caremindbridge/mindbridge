import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column('int', { default: 0 })
  sessionsIncorporated!: number;

  @Column('int', { default: 0 })
  version!: number;

  @UpdateDateColumn()
  updatedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
