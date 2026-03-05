import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { PatientPlanId, TherapistPlanId } from './subscription.plans';
import { PLANS } from './subscription.plans';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
  ) {}

  async createTrial(userId: string, plan: 'trial' | 'therapist_trial'): Promise<Subscription> {
    const config = PLANS[plan];
    const now = new Date();
    const trialEnd = new Date(now.getTime() + config.trialDays * 86400000);

    const sub = this.subRepo.create({
      userId,
      plan,
      status: 'trial',
      monthlyMessageLimit: 'monthlyMessageLimit' in config ? config.monthlyMessageLimit : 0,
      sessionMessageLimit: 'sessionMessageLimit' in config ? config.sessionMessageLimit : 0,
      patientLimit: 'patientLimit' in config ? (config.patientLimit as number) : null,
      reportLimit: 'reportLimit' in config ? (config.reportLimit as number) : null,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    });

    return this.subRepo.save(sub);
  }

  async getActive(userId: string): Promise<Subscription | null> {
    return this.subRepo.findOne({
      where: { userId, status: In(['trial', 'active', 'past_due', 'cancelled']) },
      order: { createdAt: 'DESC' },
    });
  }

  async upgradePlan(
    userId: string,
    planId: PatientPlanId | TherapistPlanId,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
  ): Promise<Subscription> {
    const config = PLANS[planId];
    let sub = await this.getActive(userId);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 86400000);

    if (sub) {
      sub.plan = planId;
      sub.status = 'active';
      sub.monthlyMessageLimit =
        'monthlyMessageLimit' in config
          ? config.monthlyMessageLimit
          : sub.monthlyMessageLimit;
      sub.sessionMessageLimit =
        'sessionMessageLimit' in config
          ? config.sessionMessageLimit
          : sub.sessionMessageLimit;
      sub.patientLimit =
        'patientLimit' in config ? (config.patientLimit as number) : sub.patientLimit;
      sub.reportLimit =
        'reportLimit' in config ? (config.reportLimit as number) : sub.reportLimit;
      sub.currentPeriodStart = now;
      sub.currentPeriodEnd = periodEnd;
      sub.trialEndsAt = null;
      if (stripeCustomerId) sub.stripeCustomerId = stripeCustomerId;
      if (stripeSubscriptionId) sub.stripeSubscriptionId = stripeSubscriptionId;
    } else {
      sub = this.subRepo.create({
        userId,
        plan: planId,
        status: 'active',
        monthlyMessageLimit:
          'monthlyMessageLimit' in config ? config.monthlyMessageLimit : 0,
        sessionMessageLimit:
          'sessionMessageLimit' in config ? config.sessionMessageLimit : 0,
        patientLimit: 'patientLimit' in config ? (config.patientLimit as number) : null,
        reportLimit: 'reportLimit' in config ? (config.reportLimit as number) : null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        stripeCustomerId,
        stripeSubscriptionId,
      });
    }

    return this.subRepo.save(sub);
  }

  async cancel(userId: string): Promise<void> {
    const sub = await this.getActive(userId);
    if (sub) {
      sub.status = 'cancelled';
      await this.subRepo.save(sub);
    }
  }

  async cancelByStripeId(stripeSubscriptionId: string): Promise<void> {
    const sub = await this.subRepo.findOne({ where: { stripeSubscriptionId } });
    if (sub) {
      sub.status = 'cancelled';
      await this.subRepo.save(sub);
    }
  }

  async setPastDue(stripeSubscriptionId: string): Promise<void> {
    const sub = await this.subRepo.findOne({ where: { stripeSubscriptionId } });
    if (sub && (sub.status === 'active' || sub.status === 'past_due')) {
      sub.status = 'past_due';
      await this.subRepo.save(sub);
    }
  }

  async renewPeriod(
    stripeSubscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<void> {
    const sub = await this.subRepo.findOne({ where: { stripeSubscriptionId } });
    if (sub) {
      sub.status = 'active';
      sub.currentPeriodStart = periodStart;
      sub.currentPeriodEnd = periodEnd;
      await this.subRepo.save(sub);
    }
  }

  async reactivate(stripeSubscriptionId: string): Promise<void> {
    const sub = await this.subRepo.findOne({ where: { stripeSubscriptionId } });
    if (sub && sub.status === 'past_due') {
      sub.status = 'active';
      await this.subRepo.save(sub);
    }
  }
}
