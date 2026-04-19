import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { RedisService } from '../redis';

import { Message } from './entities/message.entity';
import { Session, SessionStatusEnum } from './entities/session.entity';
import { ChatService } from './chat.service';

@Injectable()
export class ChatCleanupService {
  private readonly logger = new Logger(ChatCleanupService.name);

  constructor(
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
  ) {}

  // Delete active sessions with 0 messages older than 1 hour (backend safety net)
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupEmptySessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);

    const candidates = await this.sessionRepo.find({
      where: { status: SessionStatusEnum.Active, createdAt: LessThan(cutoff) },
      select: ['id'],
    });

    let deleted = 0;
    for (const { id } of candidates) {
      const msgCount = await this.messageRepo.count({ where: { sessionId: id } });
      if (msgCount === 0) {
        await this.redisService.clearSessionMessages(id);
        await this.sessionRepo.delete(id);
        deleted++;
      }
    }

    if (deleted > 0) this.logger.log(`Cleaned up ${deleted} empty session(s)`);
  }

  // Auto-complete active sessions older than 2 days
  @Cron(CronExpression.EVERY_6_HOURS)
  async expireOldSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const oldSessions = await this.sessionRepo.find({
      where: { status: SessionStatusEnum.Active, createdAt: LessThan(cutoff) },
    });

    for (const session of oldSessions) {
      try {
        session.status = SessionStatusEnum.Ended;
        session.endedAt = new Date();
        await this.sessionRepo.save(session);
        this.chatService.generateAnalysisPublic(session.id).catch((err) => {
          this.logger.error(`Auto-analysis error for expired session ${session.id}:`, err);
        });
        this.logger.log(`Auto-expired session ${session.id} (user ${session.userId})`);
      } catch (err) {
        this.logger.error(`Failed to expire session ${session.id}:`, err);
      }
    }
  }
}
