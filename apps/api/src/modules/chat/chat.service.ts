import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CBT_ANALYSIS_SYSTEM_PROMPT,
  CBT_THERAPIST_SYSTEM_PROMPT,
  ClaudeService,
} from '../claude';
import { ProfileService } from '../profile/profile.service';
import { RedisService } from '../redis';
import { UsageService } from '../subscription/usage.service';

import { Message, MessageRoleEnum } from './entities/message.entity';
import { SessionAnalysis } from './entities/session-analysis.entity';
import { Session, SessionStatusEnum } from './entities/session.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(SessionAnalysis)
    private readonly analysisRepo: Repository<SessionAnalysis>,
    private readonly claudeService: ClaudeService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly profileService: ProfileService,
    private readonly usageService: UsageService,
  ) {}

  async createSession(userId: string): Promise<Session> {
    const session = this.sessionRepo.create({ userId, status: SessionStatusEnum.Active });
    return this.sessionRepo.save(session);
  }

  async getSessions(
    userId: string,
    page = 1,
    limit = 20,
    status?: SessionStatusEnum,
  ): Promise<{ sessions: Session[]; total: number }> {
    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;

    const [sessions, total] = await this.sessionRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { sessions, total };
  }

  async getSession(sessionId: string, userId: string): Promise<Session> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
      relations: ['messages'],
      order: { messages: { orderIndex: 'ASC' } },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async sendMessage(
    sessionId: string,
    userId: string,
    content: string,
  ): Promise<Message> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatusEnum.Active) {
      throw new BadRequestException('Session is not active');
    }

    const check = await this.usageService.canSendMessage(userId, sessionId);
    if (!check.allowed) {
      throw new ForbiddenException({
        code: check.reason,
        message: this.getLimitMessage(check.reason),
        usage: check.usage,
      });
    }

    const locked = await this.redisService.acquireStreamingLock(sessionId);
    if (!locked) {
      throw new BadRequestException('Assistant is still responding');
    }

    const messageCount = await this.messageRepo.count({ where: { sessionId } });

    const userMessage = this.messageRepo.create({
      sessionId,
      role: MessageRoleEnum.User,
      content,
      orderIndex: messageCount,
    });
    await this.messageRepo.save(userMessage);

    await this.usageService.recordMessage(userId);

    await this.redisService.appendSessionMessage(sessionId, { role: 'user', content });

    this.streamAssistantResponse(sessionId, messageCount + 1).catch((err) => {
      this.logger.error(`Streaming error for session ${sessionId}:`, err);
      this.eventEmitter.emit(`chat.${sessionId}`, {
        type: 'error',
        data: 'Failed to generate response',
      });
      this.redisService.releaseStreamingLock(sessionId);
    });

    return userMessage;
  }

  private getLimitMessage(reason?: string): string {
    switch (reason) {
      case 'no_subscription': return 'No active subscription. Please choose a plan.';
      case 'trial_expired': return 'Your trial has ended. Upgrade to continue.';
      case 'monthly_limit': return 'Monthly message limit reached.';
      case 'session_limit': return 'Session message limit reached. Please start a new session.';
      case 'payment_failed': return 'Payment failed. Please update your payment method.';
      case 'subscription_expired': return 'Your subscription has expired. Please renew to continue.';
      default: return 'Message limit reached.';
    }
  }

  private async streamAssistantResponse(
    sessionId: string,
    orderIndex: number,
  ): Promise<void> {
    try {
      const [cachedMessages, session] = await Promise.all([
        this.redisService.getSessionMessages(sessionId),
        this.sessionRepo.findOne({ where: { id: sessionId } }),
      ]);

      const claudeMessages = cachedMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let systemPrompt = CBT_THERAPIST_SYSTEM_PROMPT;

      if (session) {
        const profile = await this.profileService.getByUserId(session.userId);
        if (profile) {
          const profileContext = this.profileService.getFullContext(profile);
          systemPrompt +=
            `\n\n--- PATIENT CONTEXT (from previous sessions) ---\n${profileContext}\n--- END PATIENT CONTEXT ---\n\n` +
            `Use this context to personalize your responses. Reference past themes or progress naturally when relevant, ` +
            `but do not overwhelm the patient by reciting their full history.`;
        }
      }

      let fullResponse = '';

      for await (const token of this.claudeService.streamMessage(systemPrompt, claudeMessages)) {
        fullResponse += token;
        this.eventEmitter.emit(`chat.${sessionId}`, {
          type: 'token',
          data: token,
        });
      }

      const assistantMessage = this.messageRepo.create({
        sessionId,
        role: MessageRoleEnum.Assistant,
        content: fullResponse,
        orderIndex,
      });
      await this.messageRepo.save(assistantMessage);

      await this.redisService.appendSessionMessage(sessionId, {
        role: 'assistant',
        content: fullResponse,
      });

      if (!session?.title && fullResponse.length > 0) {
        const title = fullResponse.substring(0, 80).replace(/\n/g, ' ').trim();
        await this.sessionRepo.update(sessionId, { title });
      }

      this.eventEmitter.emit(`chat.${sessionId}`, {
        type: 'message_complete',
        messageId: assistantMessage.id,
      });
    } finally {
      await this.redisService.releaseStreamingLock(sessionId);
    }
  }

  async endSession(sessionId: string, userId: string): Promise<Session> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatusEnum.Active) {
      throw new BadRequestException('Session is not active');
    }

    session.status = SessionStatusEnum.Ended;
    session.endedAt = new Date();
    await this.sessionRepo.save(session);

    this.generateAnalysis(sessionId).catch((err) => {
      this.logger.error(`Analysis error for session ${sessionId}:`, err);
    });

    return session;
  }

  private async generateAnalysis(sessionId: string): Promise<void> {
    await this.sessionRepo.update(sessionId, { status: SessionStatusEnum.Analyzing });

    const messages = await this.messageRepo.find({
      where: { sessionId },
      order: { orderIndex: 'ASC' },
    });

    const claudeMessages = messages
      .filter((m) => m.role !== MessageRoleEnum.System)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    try {
      let rawJson = await this.claudeService.generateAnalysis(
        CBT_ANALYSIS_SYSTEM_PROMPT,
        claudeMessages,
      );

      // Strip markdown code fences if Claude wraps the JSON
      rawJson = rawJson.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');

      const parsed = JSON.parse(rawJson);

      const clamp = (v: unknown): number | null => {
        if (typeof v !== 'number' || isNaN(v)) return null;
        return Math.min(10, Math.max(0, Math.round(v)));
      };

      const analysis = this.analysisRepo.create({
        sessionId,
        // CBT fields
        cognitiveDistortions: parsed.cognitiveDistortions ?? [],
        emotionalTrack: parsed.emotionalTrack ?? [],
        themes: parsed.themes ?? [],
        triggers: parsed.triggers ?? [],
        progressSummary: parsed.progressSummary ?? '',
        recommendations: parsed.recommendations ?? [],
        homework: parsed.homework ?? null,
        therapistBrief: parsed.therapistBrief ?? '',
        // Dashboard metrics
        anxietyLevel: clamp(parsed.anxietyLevel),
        depressionLevel: clamp(parsed.depressionLevel),
        keyEmotions: Array.isArray(parsed.keyEmotions) ? parsed.keyEmotions : [],
        keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
        copingStrategies: Array.isArray(parsed.copingStrategies) ? parsed.copingStrategies : [],
        riskFlags: typeof parsed.riskFlags === 'string' ? parsed.riskFlags : null,
        moodInsight: typeof parsed.moodInsight === 'string' ? parsed.moodInsight : null,
      });
      await this.analysisRepo.save(analysis);

      await this.sessionRepo.update(sessionId, { status: SessionStatusEnum.Completed });

      this.eventEmitter.emit(`chat.${sessionId}`, {
        type: 'analysis_ready',
        analysisId: analysis.id,
      });
    } catch (err) {
      this.logger.error(`Failed to parse analysis for session ${sessionId}:`, err);
      await this.sessionRepo.update(sessionId, { status: SessionStatusEnum.Ended });
    }

    try {
      const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
      if (session) {
        await this.profileService.updateProfile(session.userId, claudeMessages);
        this.logger.log(`Patient profile updated for user ${session.userId}`);
      }
    } catch (err) {
      this.logger.error(`Failed to update patient profile for session ${sessionId}:`, err);
    }

    await this.redisService.clearSessionMessages(sessionId);
  }

  async getAnalysis(sessionId: string, userId: string): Promise<SessionAnalysis> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const analysis = await this.analysisRepo.findOne({ where: { sessionId } });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    return analysis;
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.redisService.clearSessionMessages(sessionId);
    await this.sessionRepo.remove(session);
  }

  verifySessionOwnership(sessionId: string, userId: string): Promise<Session> {
    return this.getSession(sessionId, userId);
  }
}
