import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { UsageStatus } from '@mindbridge/types/src/subscription';

import { Message, MessageRoleEnum } from '../chat/entities/message.entity';
import { MessageUsage } from './entities/message-usage.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(MessageUsage)
    private readonly usageRepo: Repository<MessageUsage>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly subService: SubscriptionService,
  ) {}

  async canSendMessage(
    userId: string,
    sessionId: string,
  ): Promise<{
    allowed: boolean;
    reason?:
      | 'no_subscription'
      | 'trial_expired'
      | 'monthly_limit'
      | 'session_limit'
      | 'payment_failed'
      | 'subscription_expired';
    usage?: UsageStatus;
  }> {
    // TODO: Re-enable limits when monetization is ready
    void userId; void sessionId;
    return { allowed: true };
    /*
    const sub = await this.subService.getActive(userId);
    if (!sub) return { allowed: false, reason: 'no_subscription' };

    // Cancelled: allow until periodEnd only
    if (sub.status === 'cancelled') {
      if (new Date() > sub.currentPeriodEnd) {
        return {
          allowed: false,
          reason: 'subscription_expired',
          usage: await this.buildStatus(sub, userId, sessionId),
        };
      }
    }

    // Past due: 3-day grace period
    if (sub.status === 'past_due') {
      const daysSinceUpdate = (Date.now() - sub.updatedAt.getTime()) / 86400000;
      if (daysSinceUpdate > 3) {
        return {
          allowed: false,
          reason: 'payment_failed',
          usage: await this.buildStatus(sub, userId, sessionId, undefined, true),
        };
      }
    }

    // Trial expired: mid-session grace (allow to finish if session already started)
    if (sub.status === 'trial' && sub.trialEndsAt && new Date() > sub.trialEndsAt) {
      const sessionMsgCount = await this.messageRepo.count({
        where: { sessionId, role: In([MessageRoleEnum.User]) },
      });
      if (sessionMsgCount > 0) {
        return {
          allowed: true,
          usage: await this.buildStatus(sub, userId, sessionId, sessionMsgCount, false, true, 0),
        };
      }
      return {
        allowed: false,
        reason: 'trial_expired',
        usage: await this.buildStatus(sub, userId, sessionId),
      };
    }

    const usage = await this.getOrCreateUsage(userId, sub);

    // Bonus expiry check
    const bonusValid = !usage.bonusExpiresAt || new Date() <= usage.bonusExpiresAt;
    const effectiveBonus = bonusValid ? usage.bonusMessagesRemaining : 0;
    const monthlyRemaining =
      Math.max(0, sub.monthlyMessageLimit - usage.messagesUsed) + effectiveBonus;

    // Monthly limit with grace (3 messages if session already started)
    if (monthlyRemaining <= 0) {
      const sessionMsgCount = await this.messageRepo.count({
        where: { sessionId, role: In([MessageRoleEnum.User]) },
      });
      if (sessionMsgCount > 0 && usage.graceMessagesUsed < 3) {
        const graceRemaining = 3 - usage.graceMessagesUsed;
        return {
          allowed: true,
          usage: await this.buildStatus(
            sub,
            userId,
            sessionId,
            sessionMsgCount,
            false,
            true,
            graceRemaining,
          ),
        };
      }
      return {
        allowed: false,
        reason: 'monthly_limit',
        usage: await this.buildStatus(sub, userId, sessionId),
      };
    }

    const sessionMsgCount = await this.messageRepo.count({
      where: { sessionId, role: In([MessageRoleEnum.User]) },
    });

    if (sessionMsgCount >= sub.sessionMessageLimit) {
      return {
        allowed: false,
        reason: 'session_limit',
        usage: await this.buildStatus(sub, userId, sessionId, sessionMsgCount),
      };
    }

    const paymentWarning = sub.status === 'past_due';
    return {
      allowed: true,
      usage: await this.buildStatus(sub, userId, sessionId, sessionMsgCount, paymentWarning),
    };
    */
  }

  async recordMessage(userId: string): Promise<void> {
    // TODO: Re-enable when monetization is ready
    void userId;
    return;
    /*
    const sub = await this.subService.getActive(userId);
    if (!sub) return;

    const usage = await this.getOrCreateUsage(userId, sub);
    const bonusValid = !usage.bonusExpiresAt || new Date() <= usage.bonusExpiresAt;

    if (usage.messagesUsed < sub.monthlyMessageLimit) {
      usage.messagesUsed += 1;
    } else if (bonusValid && usage.bonusMessagesRemaining > 0) {
      usage.bonusMessagesRemaining -= 1;
    } else {
      usage.graceMessagesUsed += 1;
    }

    await this.usageRepo.save(usage);
    */
  }

  async addBonusMessages(userId: string, count: number): Promise<void> {
    const sub = await this.subService.getActive(userId);
    if (!sub) return;

    const usage = await this.getOrCreateUsage(userId, sub);
    usage.bonusMessagesRemaining += count;
    usage.bonusExpiresAt = new Date(Date.now() + 90 * 86400000);
    await this.usageRepo.save(usage);
  }

  async getStatus(
    userId: string,
    sessionId?: string,
    planType?: 'patient' | 'therapist',
  ): Promise<UsageStatus> {
    const sub = planType
      ? await this.subService.getActiveByType(userId, planType)
      : await this.subService.getActive(userId);
    if (!sub) return { hasSubscription: false };

    const paymentWarning =
      sub.status === 'past_due' &&
      (Date.now() - sub.updatedAt.getTime()) / 86400000 <= 3;

    if (sessionId) {
      const sessionMsgCount = await this.messageRepo.count({
        where: { sessionId, role: In([MessageRoleEnum.User]) },
      });
      const usage = await this.getOrCreateUsage(userId, sub);
      const bonusValid = !usage.bonusExpiresAt || new Date() <= usage.bonusExpiresAt;
      const effectiveBonus = bonusValid ? usage.bonusMessagesRemaining : 0;
      const monthlyRemaining =
        Math.max(0, sub.monthlyMessageLimit - usage.messagesUsed) + effectiveBonus;

      const isGrace = monthlyRemaining <= 0 && sessionMsgCount > 0 && usage.graceMessagesUsed < 3;
      const graceRemaining = isGrace ? 3 - usage.graceMessagesUsed : undefined;

      return this.buildStatus(
        sub,
        userId,
        sessionId,
        sessionMsgCount,
        paymentWarning,
        isGrace,
        graceRemaining,
      );
    }

    return this.buildStatus(sub, userId, undefined, undefined, paymentWarning);
  }

  async getSubscription(userId: string) {
    return this.subService.getActive(userId);
  }

  private async getOrCreateUsage(userId: string, sub: Subscription): Promise<MessageUsage> {
    const periodStart = sub.currentPeriodStart.toISOString().slice(0, 10);
    const periodEnd = sub.currentPeriodEnd.toISOString().slice(0, 10);

    let usage = await this.usageRepo.findOne({
      where: { userId, periodStart: periodStart as unknown as Date },
    });

    if (!usage) {
      usage = this.usageRepo.create({
        userId,
        messagesUsed: 0,
        bonusMessagesRemaining: 0,
        bonusExpiresAt: null,
        graceMessagesUsed: 0,
        periodStart: periodStart as unknown as Date,
        periodEnd: periodEnd as unknown as Date,
      });
      await this.usageRepo.save(usage);
    }

    return usage;
  }

  private async buildStatus(
    sub: Subscription,
    userId: string,
    sessionId?: string,
    sessionMsgCount?: number,
    paymentWarning?: boolean,
    grace?: boolean,
    graceRemaining?: number,
  ): Promise<UsageStatus> {
    const usage = await this.getOrCreateUsage(userId, sub);
    const bonusValid = !usage.bonusExpiresAt || new Date() <= usage.bonusExpiresAt;
    const effectiveBonus = bonusValid ? usage.bonusMessagesRemaining : 0;
    const mainRemaining = Math.max(0, sub.monthlyMessageLimit - usage.messagesUsed);

    return {
      hasSubscription: true,
      plan: sub.plan,
      status: sub.status,
      trialDaysLeft:
        sub.status === 'trial' && sub.trialEndsAt
          ? (() => {
              const end = sub.trialEndsAt!;
              const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
              const now = new Date();
              const todayDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
              return Math.max(0, Math.round((endDay - todayDay) / 86400000));
            })()
          : null,
      monthly: {
        used: usage.messagesUsed,
        limit: sub.monthlyMessageLimit,
        remaining: mainRemaining,
        bonusRemaining: effectiveBonus,
        totalRemaining: mainRemaining + effectiveBonus,
      },
      session: sessionId
        ? {
            used: sessionMsgCount ?? 0,
            limit: sub.sessionMessageLimit,
          }
        : undefined,
      periodEnd: sub.currentPeriodEnd.toISOString(),
      paymentWarning: paymentWarning ?? false,
      grace: grace ?? false,
      graceRemaining,
      patientLimit: sub.patientLimit ?? null,
    };
  }
}
