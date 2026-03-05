import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRoleEnum {
  Patient = 'patient',
  Therapist = 'therapist',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  password!: string | null;

  @Column({ type: 'enum', enum: UserRoleEnum, default: UserRoleEnum.Patient })
  role!: UserRoleEnum;

  @Column({ type: 'varchar', nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar!: string | null;

  @Column({ type: 'varchar', nullable: true, default: 'local' })
  provider!: string | null;

  @Column({ type: 'varchar', nullable: true })
  providerId!: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
