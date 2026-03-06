import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { SessionAnalysis } from '../chat/entities/session-analysis.entity';
import { THERAPIST_REPORT_SYSTEM_PROMPT, buildLangInstruction, detectLocale } from '../claude';
import { ClaudeService } from '../claude/claude.service';
import { Mood } from '../mood/mood.entity';
import { RedisService } from '../redis/redis.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { TherapistService } from '../therapist/therapist.service';
import { Report } from './report.entity';

export interface GenerateReportDto {
  patientId: string;
  periodStart: string;
  periodEnd: string;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Mood)
    private readonly moodRepo: Repository<Mood>,
    @InjectRepository(SessionAnalysis)
    private readonly analysisRepo: Repository<SessionAnalysis>,
    private readonly therapistService: TherapistService,
    private readonly claudeService: ClaudeService,
    private readonly redisService: RedisService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async generate(therapistId: string, dto: GenerateReportDto): Promise<Report> {
    const linked = await this.therapistService.isLinked(therapistId, dto.patientId);
    if (!linked) {
      throw new NotFoundException('Patient not found or not linked');
    }

    const sub = await this.subscriptionService.getActive(therapistId);
    if (sub && sub.reportLimit !== null && sub.reportLimit !== -1) {
      const reportsThisPeriod = await this.reportRepo.count({
        where: {
          therapistId,
          createdAt: MoreThanOrEqual(sub.currentPeriodStart),
        },
      });
      if (reportsThisPeriod >= sub.reportLimit) {
        throw new ForbiddenException({
          code: 'report_limit',
          message: 'Monthly report limit reached. Upgrade your plan for more reports.',
        });
      }
    }

    const key = `ratelimit:reports:${therapistId}`;
    const count = await this.redisService.incrementRateLimit(key, 3600);
    if (count > 5) {
      throw new HttpException('Rate limit exceeded: max 5 reports per hour', HttpStatus.TOO_MANY_REQUESTS);
    }

    const report = await this.reportRepo.save(
      this.reportRepo.create({
        therapistId,
        patientId: dto.patientId,
        status: 'generating',
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        content: null,
        errorMessage: null,
      }),
    );

    this.processReport(report.id, dto.patientId, new Date(dto.periodStart), new Date(dto.periodEnd)).catch(
      (err: unknown) => {
        this.logger.error(`Report processing failed for ${report.id}: ${String(err)}`);
      },
    );

    return report;
  }

  private async processReport(
    reportId: string,
    patientId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<void> {
    try {
      const endOfDay = new Date(periodEnd);
      endOfDay.setHours(23, 59, 59, 999);

      const [moods, analyses] = await Promise.all([
        this.moodRepo
          .createQueryBuilder('m')
          .where('m.userId = :patientId', { patientId })
          .andWhere('m.createdAt >= :start', { start: periodStart })
          .andWhere('m.createdAt <= :end', { end: endOfDay })
          .orderBy('m.createdAt', 'ASC')
          .getMany(),
        this.analysisRepo
          .createQueryBuilder('sa')
          .innerJoin('sa.session', 's')
          .where('s.userId = :patientId', { patientId })
          .andWhere('sa.createdAt >= :start', { start: periodStart })
          .andWhere('sa.createdAt <= :end', { end: endOfDay })
          .orderBy('sa.createdAt', 'ASC')
          .getMany(),
      ]);

      const patientData = this.buildPatientDataText(moods, analyses, periodStart, periodEnd);

      const localeTexts = [
        ...moods.map((m) => m.note ?? ''),
        ...analyses.flatMap((a) => [
          ...(a.keyTopics ?? []),
          a.progressSummary ?? '',
          a.moodInsight ?? '',
          a.therapistBrief ?? '',
        ]),
      ];
      const locale = detectLocale(localeTexts);
      const reportPrompt = THERAPIST_REPORT_SYSTEM_PROMPT + buildLangInstruction(locale);

      const rawJson = await this.claudeService.generateAnalysis(reportPrompt, [
        { role: 'user', content: patientData },
      ]);

      const cleaned = rawJson.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      const parsed = JSON.parse(cleaned) as {
        summary?: string;
        moodTrend?: string;
        keyThemes?: string[];
        concerns?: string[];
        copingStrategiesUsed?: string[];
        progressNotes?: string;
        suggestedFocus?: string;
        riskFlags?: string | null;
      };

      await this.reportRepo.update(reportId, {
        status: 'ready',
        content: {
          summary: parsed.summary ?? '',
          moodTrend: parsed.moodTrend ?? '',
          keyThemes: parsed.keyThemes ?? [],
          concerns: parsed.concerns ?? [],
          copingStrategiesUsed: parsed.copingStrategiesUsed ?? [],
          progressNotes: parsed.progressNotes ?? '',
          suggestedFocus: parsed.suggestedFocus ?? '',
          riskFlags: parsed.riskFlags ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`Report ${reportId} failed:`, err);
      await this.reportRepo.update(reportId, {
        status: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private buildPatientDataText(
    moods: Mood[],
    analyses: SessionAnalysis[],
    periodStart: Date,
    periodEnd: Date,
  ): string {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const moodAvg = moods.length
      ? (moods.reduce((s, m) => s + m.value, 0) / moods.length).toFixed(1)
      : 'no data';

    const moodLines = moods.map(
      (m) =>
        `  [${fmt(new Date(m.createdAt))}] value=${m.value}/10` +
        (m.emotions?.length ? `, emotions: ${m.emotions.join(', ')}` : '') +
        (m.note ? `, note: "${m.note}"` : ''),
    );

    const analysisLines = analyses.map((a, i) => {
      const parts = [
        `Session ${i + 1} [${fmt(new Date(a.createdAt))}]:`,
        `  anxiety=${a.anxietyLevel ?? 'n/a'}/10, depression=${a.depressionLevel ?? 'n/a'}/10`,
        a.keyEmotions?.length ? `  emotions: ${a.keyEmotions.join(', ')}` : '',
        a.keyTopics?.length ? `  topics: ${a.keyTopics.join(', ')}` : '',
        a.copingStrategies?.length ? `  coping: ${a.copingStrategies.join(', ')}` : '',
        a.riskFlags ? `  RISK FLAGS: ${a.riskFlags}` : '',
        a.progressSummary ? `  progress: ${a.progressSummary}` : '',
        a.moodInsight ? `  insight: ${a.moodInsight}` : '',
      ];
      return parts.filter(Boolean).join('\n');
    });

    return [
      `Generate a therapist report for a patient. Period: ${fmt(periodStart)} to ${fmt(periodEnd)}.`,
      '',
      `MOOD ENTRIES (${moods.length} total, average: ${moodAvg}/10):`,
      moodLines.length ? moodLines.join('\n') : '  No mood entries in this period.',
      '',
      `CBT SESSION ANALYSES (${analyses.length} sessions):`,
      analysisLines.length ? analysisLines.join('\n\n') : '  No sessions in this period.',
    ].join('\n');
  }

  async findById(id: string, therapistId: string): Promise<Report> {
    const report = await this.reportRepo.findOne({ where: { id, therapistId } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async findByPatient(therapistId: string, patientId: string): Promise<Report[]> {
    return this.reportRepo.find({
      where: { therapistId, patientId },
      order: { createdAt: 'DESC' },
    });
  }
}
