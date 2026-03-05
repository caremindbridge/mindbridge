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
import { RedisService } from '../redis';

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

  private async streamAssistantResponse(
    sessionId: string,
    orderIndex: number,
  ): Promise<void> {
    try {
      const cachedMessages = await this.redisService.getSessionMessages(sessionId);
      const claudeMessages = cachedMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let fullResponse = '';

      for await (const token of this.claudeService.streamMessage(
        CBT_THERAPIST_SYSTEM_PROMPT,
        claudeMessages,
      )) {
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

      if (!this.sessionRepo.findOne({ where: { id: sessionId } })) return;

      const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
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
