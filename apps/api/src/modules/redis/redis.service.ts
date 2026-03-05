import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(this.configService.get<string>('redis.url')!, {
      retryStrategy: (times) => Math.min(times * 200, 5000),
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  private sessionKey(sessionId: string): string {
    return `chat:session:${sessionId}:messages`;
  }

  private lockKey(sessionId: string): string {
    return `chat:session:${sessionId}:streaming`;
  }

  async getSessionMessages(sessionId: string): Promise<Array<{ role: string; content: string }>> {
    const data = await this.client.get(this.sessionKey(sessionId));
    return data ? JSON.parse(data) : [];
  }

  async setSessionMessages(
    sessionId: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<void> {
    await this.client.set(this.sessionKey(sessionId), JSON.stringify(messages), 'EX', 86400);
  }

  async appendSessionMessage(
    sessionId: string,
    message: { role: string; content: string },
  ): Promise<void> {
    const messages = await this.getSessionMessages(sessionId);
    messages.push(message);
    await this.setSessionMessages(sessionId, messages);
  }

  async clearSessionMessages(sessionId: string): Promise<void> {
    await this.client.del(this.sessionKey(sessionId));
  }

  async acquireStreamingLock(sessionId: string): Promise<boolean> {
    const result = await this.client.set(this.lockKey(sessionId), '1', 'EX', 120, 'NX');
    return result === 'OK';
  }

  async releaseStreamingLock(sessionId: string): Promise<void> {
    await this.client.del(this.lockKey(sessionId));
  }

  private inviteKey(code: string): string {
    return `invite:${code}`;
  }

  async setInviteCode(
    code: string,
    data: { linkId: string; therapistId: string; patientId: string },
  ): Promise<void> {
    await this.client.set(this.inviteKey(code), JSON.stringify(data), 'EX', 604800);
  }

  async getInviteCode(
    code: string,
  ): Promise<{ linkId: string; therapistId: string; patientId: string } | null> {
    const raw = await this.client.get(this.inviteKey(code));
    return raw ? (JSON.parse(raw) as { linkId: string; therapistId: string; patientId: string }) : null;
  }

  async deleteInviteCode(code: string): Promise<void> {
    await this.client.del(this.inviteKey(code));
  }

  async incrementRateLimit(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async setResetToken(token: string, userId: string): Promise<void> {
    await this.client.set(`reset:${token}`, userId, 'EX', 3600);
  }

  async getResetToken(token: string): Promise<string | null> {
    return this.client.get(`reset:${token}`);
  }

  async deleteResetToken(token: string): Promise<void> {
    await this.client.del(`reset:${token}`);
  }
}
