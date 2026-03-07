import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { Report } from '../report/report.entity';
import { PatientTherapist } from '../therapist/entities/patient-therapist.entity';

import { SubscriptionService } from './subscription.service';

export interface TherapistFeatures {
  plan: string;
  isTrial: boolean;
  trialEndsAt: Date | null;
  patientLimit: number;
  reportLimit: number;
  activePatientCount: number;
  reportsThisMonth: number;
  canWriteMiraInstructions: boolean;
  canViewMoodAnalytics: boolean;
  canViewFullAnalysis: boolean;
}

@Injectable()
export class PlanFeatureService {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(PatientTherapist)
    private readonly ptRepo: Repository<PatientTherapist>,
  ) {}

  async getTherapistFeatures(userId: string): Promise<TherapistFeatures> {
    const sub = await this.subscriptionService.getActiveByType(userId, 'therapist');
    const plan = sub?.plan ?? 'therapist_trial';
    const isTrial = plan === 'therapist_trial';
    const isSolo = plan === 'therapist_solo';

    const patientLimit = sub?.patientLimit ?? 2;
    const reportLimit = sub?.reportLimit ?? 3;

    const activePatientCount = await this.ptRepo.count({
      where: { therapistId: userId, status: 'active' },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const reportsThisMonth = await this.reportRepo.count({
      where: { therapistId: userId, createdAt: Between(monthStart, nextMonthStart) },
    });

    return {
      plan,
      isTrial,
      trialEndsAt: sub?.trialEndsAt ?? null,
      patientLimit: patientLimit as number,
      reportLimit: reportLimit as number,
      activePatientCount,
      reportsThisMonth,
      canWriteMiraInstructions: !isTrial,
      canViewMoodAnalytics: !isTrial && !isSolo,
      canViewFullAnalysis: !isTrial && !isSolo,
    };
  }
}
