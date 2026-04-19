import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SessionAnalysis } from '../chat/entities/session-analysis.entity';
import { ClaudeService } from '../claude/claude.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SessionAnalysis)
    private readonly analysisRepo: Repository<SessionAnalysis>,
    private readonly claudeService: ClaudeService,
    private readonly redisService: RedisService,
  ) {}

  private getMonWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }

  async getMoodMetrics(userId: string, from?: Date, to?: Date) {
    // Mood-filtered analyses for chart data
    const qb = this.analysisRepo
      .createQueryBuilder('sa')
      .innerJoin('sa.session', 's')
      .where('s.userId = :userId', { userId })
      .andWhere('sa.anxietyLevel IS NOT NULL');

    if (from) qb.andWhere('sa.createdAt >= :from', { from });
    if (to) qb.andWhere('sa.createdAt <= :to', { to });

    const analyses = await qb.orderBy('sa.createdAt', 'DESC').take(50).getMany();

    // All analyses with session data for session rhythm, distortions, triggers
    const allQb = this.analysisRepo
      .createQueryBuilder('sa')
      .innerJoinAndSelect('sa.session', 's')
      .where('s.userId = :userId', { userId });

    if (from) allQb.andWhere('sa.createdAt >= :from', { from });
    if (to) allQb.andWhere('sa.createdAt <= :to', { to });

    const allAnalyses = await allQb.orderBy('sa.createdAt', 'ASC').getMany();

    // Session-level metrics
    const sessionCount = allAnalyses.length;
    let totalDurationMs = 0;
    let durationCount = 0;
    const distinctDays = new Set<string>();
    const weekGroups = new Map<string, number>();

    for (const a of allAnalyses) {
      const sess = a.session;
      const createdAt = new Date(sess.createdAt);

      if (sess.endedAt) {
        totalDurationMs += new Date(sess.endedAt).getTime() - createdAt.getTime();
        durationCount++;
      }
      distinctDays.add(createdAt.toISOString().split('T')[0]);
      const weekStart = this.getMonWeekStart(createdAt);
      weekGroups.set(weekStart, (weekGroups.get(weekStart) ?? 0) + 1);
    }

    const avgDurationMins = durationCount > 0 ? Math.round(totalDurationMs / durationCount / 60000) : 0;
    const totalDays = distinctDays.size;

    const sortedWeeks = Array.from(weekGroups.entries()).sort(([a], [b]) => a.localeCompare(b));
    const sessionsPerWeek = sortedWeeks.slice(-4).map(([_, count], i) => ({
      weekNumber: i + 1,
      count,
    }));

    // Cognitive distortions & triggers
    let cognitiveDistortionsTotal = 0;
    let reframedCount = 0;
    const distortionCounts = new Map<string, number>();
    const triggerCounts = new Map<string, number>();

    for (const a of allAnalyses) {
      const distortionsInSession = a.cognitiveDistortions?.length ?? 0;
      const hasCopping = (a.copingStrategies?.length ?? 0) > 0;
      cognitiveDistortionsTotal += distortionsInSession;
      if (hasCopping) reframedCount += distortionsInSession;

      for (const d of a.cognitiveDistortions ?? []) {
        const type = d.type?.trim();
        if (type) distortionCounts.set(type, (distortionCounts.get(type) ?? 0) + 1);
      }
      for (const trigger of a.triggers ?? []) {
        const t = trigger?.trim();
        if (t) triggerCounts.set(t, (triggerCounts.get(t) ?? 0) + 1);
      }
    }

    const topDistortion =
      distortionCounts.size > 0
        ? Array.from(distortionCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : null;

    const topTriggers = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trigger, count]) => ({ trigger, count }));

    const extraFields = {
      totalDays,
      sessionCount,
      avgDurationMins,
      sessionsPerWeek,
      cognitiveDistortionsTotal,
      reframedCount,
      topDistortion,
      topTriggers,
    };

    if (analyses.length === 0) {
      return {
        analyses: [],
        averageAnxiety: null,
        averageDepression: null,
        topEmotions: [],
        topTopics: [],
        latestInsight: null,
        ...extraFields,
      };
    }

    const averageAnxiety =
      analyses.reduce((s, a) => s + (a.anxietyLevel ?? 0), 0) / analyses.length;
    const averageDepression =
      analyses.reduce((s, a) => s + (a.depressionLevel ?? 0), 0) / analyses.length;

    const emotionCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};

    for (const a of analyses) {
      for (const e of a.keyEmotions ?? []) emotionCounts[e] = (emotionCounts[e] ?? 0) + 1;
      for (const t of a.keyTopics ?? []) topicCounts[t] = (topicCounts[t] ?? 0) + 1;
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
        therapistBrief: a.therapistBrief ?? null,
        createdAt: a.createdAt,
      })),
      averageAnxiety: Math.round(averageAnxiety * 10) / 10,
      averageDepression: Math.round(averageDepression * 10) / 10,
      topEmotions,
      topTopics,
      latestInsight: analyses[0]?.moodInsight ?? null,
      ...extraFields,
    };
  }

  async getMiraOverview(
    userId: string,
    period: 'week' | 'month',
    locale: string,
  ): Promise<{ text: string }> {
    const cached = await this.redisService.getMiraOverview(userId, period, locale);
    if (cached) return { text: cached };

    const daysBack = period === 'week' ? 7 : 30;
    const from = new Date();
    from.setDate(from.getDate() - daysBack);

    const metrics = await this.getMoodMetrics(userId, from, undefined);

    if (metrics.sessionCount === 0) {
      const empty =
        locale === 'ru'
          ? 'Ещё нет достаточно данных. Начни сессии — и я поделюсь своими наблюдениями о твоём пути.'
          : "Not enough data yet. Complete some sessions and I'll share my observations about your journey.";
      return { text: empty };
    }

    const isRu = locale === 'ru';
    const periodLabel = isRu
      ? period === 'week'
        ? 'прошедшую неделю'
        : 'прошедший месяц'
      : period === 'week'
        ? 'the past week'
        : 'the past month';

    const dataLines = [
      `Sessions completed: ${metrics.sessionCount}`,
      `Days with reflection: ${metrics.totalDays}`,
      `Average anxiety: ${metrics.averageAnxiety ?? 'N/A'}/10`,
      `Average depression: ${metrics.averageDepression ?? 'N/A'}/10`,
      metrics.topEmotions.length > 0
        ? `Top emotions: ${metrics.topEmotions.slice(0, 3).map((e) => e.emotion).join(', ')}`
        : null,
      metrics.topTopics.length > 0
        ? `Main topics: ${metrics.topTopics.slice(0, 3).map((t) => t.topic).join(', ')}`
        : null,
      metrics.topDistortion ? `Most common cognitive distortion: ${metrics.topDistortion}` : null,
      metrics.topTriggers.length > 0
        ? `Key triggers: ${metrics.topTriggers.slice(0, 2).map((t) => t.trigger).join(', ')}`
        : null,
      metrics.cognitiveDistortionsTotal > 0
        ? `Thoughts noticed: ${metrics.cognitiveDistortionsTotal}, reframed: ${metrics.reframedCount}`
        : null,
      metrics.latestInsight ? `Latest session insight: "${metrics.latestInsight}"` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const systemPrompt = isRu
      ? `Ты Мира — тёплый, проницательный ИИ-терапевт, работающий в парадигме КПТ.
Напиши 2–3 абзаца личного синтеза для пациента — обзор его работы за ${periodLabel}.
Обращайся к пациенту на «ты». Пиши тепло, конкретно, без клинической сухости.
Без маркированных списков и заголовков — только связный живой текст.
Упоминай реальные эмоции, темы и паттерны из данных — пусть пациент почувствует, что ты видишь именно его путь.
Заверши мягким взглядом вперёд: что можно исследовать или попробовать дальше.
Пиши как носитель языка: избегай кальки с английского и книжных оборотов.`
      : `You are Mira, a warm and insightful AI CBT therapist.
Write 2–3 paragraphs as a personal synthesis for your patient — an overview of their work over ${periodLabel}.
Address the patient in second person. Be warm and specific, never clinical.
No bullet points or headers — flowing prose only.
Reference the actual emotions, topics, and patterns from the data so the patient feels you see their specific journey.
End with a gentle forward-looking note: something to explore or try next.`;

    const userMessage = `Patient analytics for ${periodLabel}:\n${dataLines}\n\nWrite the synthesis in ${isRu ? 'Russian' : 'English'}.`;

    const raw = await this.claudeService.complete(
      systemPrompt,
      [{ role: 'user', content: userMessage }],
      { maxTokens: 512 },
    );
    const text = raw.replace(/^#+\s+[^\n]*\n*/gm, '').trim();

    await this.redisService.setMiraOverview(userId, period, locale, text);

    return { text };
  }
}
