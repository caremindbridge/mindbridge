import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Session } from './session.entity';

export enum MessageRoleEnum {
  User = 'user',
  Assistant = 'assistant',
  System = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MessageRoleEnum })
  role!: MessageRoleEnum;

  @Column({ type: 'text' })
  content!: string;

  @Column()
  sessionId!: string;

  @ManyToOne(() => Session, (session) => session.messages, { onDelete: 'CASCADE' })
  session!: Session;

  @Column({ type: 'int' })
  orderIndex!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
