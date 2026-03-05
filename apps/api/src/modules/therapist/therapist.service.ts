import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SessionAnalysis } from '../chat/entities/session-analysis.entity';
import { Mood } from '../mood/mood.entity';
import { RedisService } from '../redis/redis.service';
import { UserRoleEnum } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { PatientTherapist } from './entities/patient-therapist.entity';

const INVITE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += INVITE_CHARSET[Math.floor(Math.random() * INVITE_CHARSET.length)];
  }
  return code;
}

type StatusColor = 'red' | 'yellow' | 'green';

function computeStatusColor(
  anxietyLevel: number | null,
  depressionLevel: number | null,
  riskFlags: string | null,
  avgMood: number | null,
): StatusColor {
  if (
    riskFlags ||
    (anxietyLevel !== null && anxietyLevel >= 8) ||
    (depressionLevel !== null && depressionLevel >= 8)
  ) {
    return 'red';
  }
  if (
    (anxietyLevel !== null && anxietyLevel >= 5) ||
    (depressionLevel !== null && depressionLevel >= 5) ||
    (avgMood !== null && avgMood <= 4)
  ) {
    return 'yellow';
  }
  return 'green';
}

const STATUS_ORDER: Record<StatusColor, number> = { red: 0, yellow: 1, green: 2 };

@Injectable()
export class TherapistService {
  constructor(
    @InjectRepository(PatientTherapist)
    private readonly linkRepo: Repository<PatientTherapist>,
    @InjectRepository(Mood)
    private readonly moodRepo: Repository<Mood>,
    @InjectRepository(SessionAnalysis)
    private readonly analysisRepo: Repository<SessionAnalysis>,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  async invitePatient(therapistId: string, email: string): Promise<{ inviteCode: string }> {
    const patient = await this.usersService.findByEmail(email);
    if (!patient || patient.role !== UserRoleEnum.Patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.id === therapistId) {
      throw new BadRequestException('Cannot invite yourself');
    }

    const existing = await this.linkRepo.findOne({
      where: { therapistId, patientId: patient.id, status: 'active' },
    });
    if (existing) {
      throw new ConflictException('Patient is already linked to this therapist');
    }

    // Invalidate any previous pending invite
    const pending = await this.linkRepo.findOne({
      where: { therapistId, patientId: patient.id, status: 'pending' },
    });
    if (pending) {
      if (pending.inviteCode) await this.redisService.deleteInviteCode(pending.inviteCode);
      await this.linkRepo.remove(pending);
    }

    const code = generateCode();
    const link = await this.linkRepo.save(
      this.linkRepo.create({
        therapistId,
        patientId: patient.id,
        status: 'pending',
        inviteCode: code,
      }),
    );

    await this.redisService.setInviteCode(code, {
      linkId: link.id,
      therapistId,
      patientId: patient.id,
    });

    return { inviteCode: code };
  }

  async acceptInvite(patientId: string, inviteCode: string): Promise<PatientTherapist> {
    const stored = await this.redisService.getInviteCode(inviteCode);
    if (!stored) {
      throw new NotFoundException('Invite code not found or expired');
    }
    if (stored.patientId !== patientId) {
      throw new UnauthorizedException('This invite code is not for you');
    }

    const link = await this.linkRepo.findOne({ where: { id: stored.linkId } });
    if (!link) {
      throw new NotFoundException('Invite not found');
    }

    link.status = 'active';
    link.connectedAt = new Date();
    link.inviteCode = null;
    await this.linkRepo.save(link);

    await this.redisService.deleteInviteCode(inviteCode);

    return link;
  }

  async isLinked(therapistId: string, patientId: string): Promise<boolean> {
    const link = await this.linkRepo.findOne({
      where: { therapistId, patientId, status: 'active' },
    });
    return !!link;
  }

  async getPatients(therapistId: string) {
    const links = await this.linkRepo.find({
      where: { therapistId },
      relations: ['patient'],
      order: { createdAt: 'DESC' },
    });

    const patients = await Promise.all(
      links.map(async (link) => {
        const pid = link.patientId;

        const moods = await this.moodRepo.find({
          where: { userId: pid },
          order: { createdAt: 'DESC' },
          take: 100,
        });

        const avgMood = moods.length
          ? +(moods.reduce((s, m) => s + m.value, 0) / moods.length).toFixed(1)
          : null;

        const latestAnalysis = await this.analysisRepo
          .createQueryBuilder('sa')
          .innerJoin('sa.session', 's')
          .where('s.userId = :pid', { pid })
          .andWhere('sa.anxietyLevel IS NOT NULL')
          .orderBy('sa.createdAt', 'DESC')
          .getOne();

        const anxietyLevel = latestAnalysis?.anxietyLevel ?? null;
        const depressionLevel = latestAnalysis?.depressionLevel ?? null;
        const riskFlags = latestAnalysis?.riskFlags ?? null;
        const statusColor = computeStatusColor(anxietyLevel, depressionLevel, riskFlags, avgMood);

        return {
          linkId: link.id,
          linkStatus: link.status,
          patient: { id: link.patient.id, email: link.patient.email },
          avgMood,
          anxietyLevel,
          depressionLevel,
          riskFlags,
          statusColor,
          connectedAt: link.connectedAt,
          lastActivity: latestAnalysis?.createdAt ?? null,
        };
      }),
    );

    return patients.sort((a, b) => STATUS_ORDER[a.statusColor] - STATUS_ORDER[b.statusColor]);
  }

  async getPatientProfile(therapistId: string, patientId: string) {
    const link = await this.linkRepo.findOne({
      where: { therapistId, patientId },
      relations: ['patient'],
    });
    if (!link) throw new NotFoundException('Patient not found');

    const [moods, analyses] = await Promise.all([
      this.moodRepo.find({
        where: { userId: patientId },
        order: { createdAt: 'DESC' },
        take: 30,
      }),
      this.analysisRepo
        .createQueryBuilder('sa')
        .innerJoin('sa.session', 's')
        .where('s.userId = :patientId', { patientId })
        .orderBy('sa.createdAt', 'DESC')
        .take(10)
        .getMany(),
    ]);

    const avgMood = moods.length
      ? +(moods.reduce((s, m) => s + m.value, 0) / moods.length).toFixed(1)
      : null;

    const emotionCounts: Record<string, number> = {};
    for (const m of moods) {
      for (const e of m.emotions ?? []) {
        emotionCounts[e] = (emotionCounts[e] ?? 0) + 1;
      }
    }
    const emotionDistribution = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);

    return {
      patient: { id: link.patient.id, email: link.patient.email },
      linkStatus: link.status,
      connectedAt: link.connectedAt,
      moodStats: { avgMood, totalEntries: moods.length },
      moods,
      analyses,
      emotionDistribution,
    };
  }

  async disconnectPatient(therapistId: string, patientId: string): Promise<void> {
    const link = await this.linkRepo.findOne({ where: { therapistId, patientId } });
    if (!link) throw new NotFoundException('Patient not found');
    await this.linkRepo.update(link.id, { status: 'inactive' });
  }

  async disconnectFromTherapist(patientId: string): Promise<void> {
    const link = await this.linkRepo.findOne({
      where: { patientId, status: 'active' },
    });
    if (!link) throw new NotFoundException('No active therapist connection found');
    await this.linkRepo.update(link.id, { status: 'inactive' });
  }

  async getMyTherapist(patientId: string) {
    const link = await this.linkRepo.findOne({
      where: { patientId, status: 'active' },
      relations: ['therapist'],
    });
    if (!link) throw new NotFoundException('No therapist linked');
    return {
      id: link.therapist.id,
      email: link.therapist.email,
      connectedAt: link.connectedAt,
    };
  }
}
