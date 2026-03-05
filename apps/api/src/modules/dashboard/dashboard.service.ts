import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SessionAnalysis } from '../chat/entities/session-analysis.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SessionAnalysis)
    private readonly analysisRepo: Repository<SessionAnalysis>,
  ) {}

  async getMoodMetrics(userId: string, from?: Date, to?: Date) {
    const qb = this.analysisRepo
      .createQueryBuilder('sa')
      .innerJoin('sa.session', 's')
      .where('s.userId = :userId', { userId })
      .andWhere('sa.anxietyLevel IS NOT NULL');

    if (from) qb.andWhere('sa.createdAt >= :from', { from });
    if (to) qb.andWhere('sa.createdAt <= :to', { to });

    const analyses = await qb.orderBy('sa.createdAt', 'DESC').take(50).getMany();

    if (analyses.length === 0) {
      return {
        analyses: [],
        averageAnxiety: null,
        averageDepression: null,
        topEmotions: [],
        topTopics: [],
        latestInsight: null,
      };
    }

    const averageAnxiety =
      analyses.reduce((s, a) => s + (a.anxietyLevel ?? 0), 0) / analyses.length;
    const averageDepression =
      analyses.reduce((s, a) => s + (a.depressionLevel ?? 0), 0) / analyses.length;

    const emotionCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};

    for (const a of analyses) {
      for (const e of a.keyEmotions ?? []) {
        emotionCounts[e] = (emotionCounts[e] ?? 0) + 1;
      }
      for (const t of a.keyTopics ?? []) {
        topicCounts[t] = (topicCounts[t] ?? 0) + 1;
      }
    }

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    return {
      analyses: analyses.map((a) => ({
        id: a.id,
        sessionId: a.sessionId,
        anxietyLevel: a.anxietyLevel,
        depressionLevel: a.depressionLevel,
        keyEmotions: a.keyEmotions,
        keyTopics: a.keyTopics,
        copingStrategies: a.copingStrategies,
        riskFlags: a.riskFlags,
        moodInsight: a.moodInsight,
        createdAt: a.createdAt,
      })),
      averageAnxiety: Math.round(averageAnxiety * 10) / 10,
      averageDepression: Math.round(averageDepression * 10) / 10,
      topEmotions,
      topTopics,
      latestInsight: analyses[0]?.moodInsight ?? null,
    };
  }
}
