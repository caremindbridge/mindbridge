'use client';

import { startOfDay, subDays } from 'date-fns';
import {
  Brain,
  Briefcase,
  Check,
  Eye,
  Heart,
  Info,
  Moon,
  Share2,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import {
  useMiraOverview,
  useMoodMetrics,
  type AnalysisMetric,
  type DashboardMetrics,
} from '@/entities/dashboard';
import { createSession } from '@/shared/api/client';
import { analytics } from '@/shared/lib/analytics';
import { siteConfig } from '@/shared/lib/site-config';
import { cn } from '@/shared/lib/utils';

const EMOTION_LABELS: Record<string, Record<string, string>> = {
  en: {
    anxiety: 'Anxiety', sadness: 'Sadness', joy: 'Joy', calm: 'Calm',
    irritation: 'Irritation', fear: 'Fear', anger: 'Anger',
    hope: 'Hope', loneliness: 'Loneliness', gratitude: 'Gratitude',
  },
  ru: {
    anxiety: 'Тревога', sadness: 'Грусть', joy: 'Радость', calm: 'Спокойствие',
    irritation: 'Раздражение', fear: 'Страх', anger: 'Злость',
    hope: 'Надежда', loneliness: 'Одиночество', gratitude: 'Благодарность',
  },
};

function localizeEmotion(emotion: string, locale: string): string {
  return EMOTION_LABELS[locale]?.[emotion.toLowerCase()] ?? emotion;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wellnessScore(a: AnalysisMetric): number {
  return 10 - ((a.anxietyLevel ?? 5) + (a.depressionLevel ?? 5)) / 2;
}

function buildSparkline(analyses: AnalysisMetric[], W = 306, H = 80) {
  if (analyses.length < 2) return null;

  const sorted = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const scores = sorted.map(wellnessScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const pad = 8;

  const pts = scores.map((s, i) => ({
    x: pad + (i / (scores.length - 1)) * (W - 2 * pad),
    y: pad + (1 - (s - min) / range) * (H - 2 * pad),
  }));

  let line = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i].x - pts[i - 1].x) / 3;
    line += ` C ${(pts[i - 1].x + cp).toFixed(1)} ${pts[i - 1].y.toFixed(1)}, ${(pts[i].x - cp).toFixed(1)} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;

  const half = Math.ceil(scores.length / 2);
  const avgRecent =
    scores.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, scores.length - half);
  const avgOlder = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const trendPct = avgOlder > 0 ? Math.round(((avgRecent - avgOlder) / avgOlder) * 100) : 0;

  let biggestJump = 0;
  let biggestJumpIdx = 1;
  for (let i = 1; i < scores.length; i++) {
    const jump = Math.abs(scores[i] - scores[i - 1]);
    if (jump > biggestJump) {
      biggestJump = jump;
      biggestJumpIdx = i + 1;
    }
  }

  return { line, area, pts, trendPct, biggestJumpIdx };
}

function getMoodBars(analyses: AnalysisMetric[], period: 'week' | 'month', locale: string) {
  // locale-aware single-letter day labels (Mon=0 … Sun=6)
  const DAY_LETTERS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i); // Jan 1 2024 is a Monday
    return d.toLocaleDateString(locale, { weekday: 'narrow' });
  });

  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayIdx = d.getDay(); // 0=Sun
      const label = DAY_LETTERS[dayIdx === 0 ? 6 : dayIdx - 1];
      const dayData = analyses.filter(
        (a) => new Date(a.createdAt).toISOString().split('T')[0] === dateStr,
      );
      const score =
        dayData.length > 0
          ? dayData.reduce((s, a) => s + (10 - (a.anxietyLevel ?? 5)), 0) / dayData.length
          : 0;
      return { label, score, hasData: dayData.length > 0 };
    });
  }

  return Array.from({ length: 4 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    const weekData = analyses.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= start && d < end;
    });
    const score =
      weekData.length > 0
        ? weekData.reduce((s, a) => s + (10 - (a.anxietyLevel ?? 5)), 0) / weekData.length
        : 0;
    return { label: `W${4 - i}`, score, hasData: weekData.length > 0 };
  }).reverse();
}

function getTriggerIcon(trigger: string) {
  const l = trigger.toLowerCase();
  if (l.includes('work') || l.includes('job') || l.includes('career') || l.includes('работ'))
    return Briefcase;
  if (l.includes('sleep') || l.includes('сон') || l.includes('insomnia')) return Moon;
  if (l.includes('social') || l.includes('friend') || l.includes('люди') || l.includes('общен'))
    return Users;
  if (l.includes('family') || l.includes('семья') || l.includes('relation') || l.includes('parent'))
    return Heart;
  return Zap;
}

function triggerFreq(count: number, total: number, locale: string): string {
  if (total === 0) return '';
  const pct = count / total;
  const isRu = locale === 'ru';
  if (pct >= 0.5) return isRu ? 'ежедневно' : 'daily';
  if (pct >= 0.3) return isRu ? '4р/нед' : '4x/wk';
  return isRu ? '2р/нед' : '2x/wk';
}

const EMOTION_COLORS = ['#7A9E7E', '#D4A08C', '#C4856F', '#8BA5C2', '#C2A58B'];
const THEME_COLORS = ['#C4856F', '#D4A574', '#8BAA7E', '#7B98B5', '#B08CB5'];

// ─── Primitives ───────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#C4856F]">{children}</p>
  );
}

function Card({
  children,
  className,
  leftAccent,
}: {
  children: React.ReactNode;
  className?: string;
  leftAccent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[20px] bg-white shadow-[0_2px_10px_#2B232012] dark:bg-[#221E1B]',
        leftAccent && 'border-l-4 border-[#C4856F]',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Section cards ────────────────────────────────────────────────────────────

function WellbeingCard({
  analyses,
  period,
  t,
}: {
  analyses: AnalysisMetric[];
  period: 'week' | 'month';
  t: ReturnType<typeof useTranslations>;
}) {
  const sparkline = useMemo(() => buildSparkline(analyses), [analyses]);

  const trendKey =
    !sparkline || sparkline.trendPct === 0
      ? 'trajectoryStable'
      : sparkline.trendPct > 0
        ? 'trajectoryUp'
        : 'trajectoryDown';

  const deltaPillKey =
    sparkline && sparkline.trendPct >= 0
      ? period === 'week'
        ? 'trajectoryDeltaThisWeek'
        : 'trajectoryDeltaThisMonth'
      : period === 'week'
        ? 'trajectoryDeltaDownWeek'
        : 'trajectoryDeltaDownMonth';

  const vsKey = period === 'week' ? 'trajectoryVsLastWeek' : 'trajectoryVsLastMonth';

  return (
    <Card className="flex flex-col gap-3.5 p-[22px] pb-5">
      <Eyebrow>{t('trajectoryEyebrow')}</Eyebrow>
      <p className="text-[22px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">{t(trendKey)}</p>

      {/* Sparkline */}
      <div className="h-20 w-full overflow-hidden">
        {sparkline ? (
          <svg viewBox="0 0 306 80" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E0A88A" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#E0A88A" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={sparkline.area} fill="url(#sparkGrad)" />
            <path
              d={sparkline.line}
              fill="none"
              stroke="#C4856F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {sparkline.pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="#C4856F" opacity="0.7" />
            ))}
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">
              {t('trajectoryEmpty')}
            </p>
          </div>
        )}
      </div>

      {/* Delta row */}
      {sparkline && (
        <div className="flex items-center gap-2.5">
          <div className="rounded-full bg-[#F5EDE6] px-2.5 py-1 dark:bg-[#2A211B]">
            <span className="text-[12px] font-semibold text-[#C4856F]">
              {t(deltaPillKey, { pct: Math.abs(sparkline.trendPct) })}
            </span>
          </div>
          <span className="text-[12px] font-medium text-[#9A8880] dark:text-[#7A706A]">
            {t(vsKey)}
          </span>
        </div>
      )}

      {/* Footer */}
      {sparkline && sparkline.biggestJumpIdx > 0 && (
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-[#9A8880]" />
          <span className="text-[12px] font-medium text-[#9A8880] dark:text-[#7A706A]">
            {t('trajectoryFooter', { n: sparkline.biggestJumpIdx })}
          </span>
        </div>
      )}
    </Card>
  );
}

function MoodJourneyCard({
  analyses,
  period,
  locale,
  t,
}: {
  analyses: AnalysisMetric[];
  period: 'week' | 'month';
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const bars = useMemo(() => getMoodBars(analyses, period, locale), [analyses, period, locale]);
  const maxScore = Math.max(...bars.map((b) => b.score), 1);

  const weekLabel = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (d: Date) => `${d.toLocaleDateString(locale, { weekday: 'short' })} ${d.getDate()}`;
    return `${fmt(mon)} — ${fmt(sun)}`;
  }, [locale]);

  return (
    <Card className="flex flex-col gap-3.5 p-5">
      <p className="text-[17px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">
        {t('moodJourneyTitle')}
      </p>

      {period === 'week' && (
        <p className="text-[12px] font-medium text-[#9A8880] dark:text-[#7A706A]">{weekLabel}</p>
      )}

      {/* Bar chart */}
      <div className="relative h-[180px]">
        <div className="absolute inset-x-0 top-[25%] h-px bg-[#F0E4DE] dark:bg-[#3A332E]" />
        <div className="absolute inset-x-0 top-[50%] h-px bg-[#F0E4DE] dark:bg-[#3A332E]" />
        <div className="absolute inset-x-0 top-[75%] h-px bg-[#F0E4DE] dark:bg-[#3A332E]" />
        <div className="absolute inset-0 flex items-end justify-between">
          {bars.map((bar, i) => (
            <div key={i} className="flex h-full w-[32px] flex-col items-center justify-end gap-1.5">
              {bar.hasData && (
                <div className="h-1 w-1 rounded-full" style={{ background: '#C4856F66' }} />
              )}
              <div
                className="w-[26px] rounded-t-[8px] rounded-b-[2px] transition-all duration-500"
                style={{
                  height: bar.hasData ? `${(bar.score / maxScore) * 92}%` : '2%',
                  background: bar.hasData
                    ? 'linear-gradient(to bottom, #E0A88A, #C4856F)'
                    : '#F0E4DE',
                  minHeight: '3px',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Day labels */}
      <div className="flex justify-between">
        {bars.map((bar, i) => (
          <div key={i} className="flex w-[32px] justify-center">
            <span className="text-[10px] font-medium text-[#9A8880] dark:text-[#7A706A]">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NoticingCard({
  metrics,
  period,
  t,
}: {
  metrics: DashboardMetrics;
  period: 'week' | 'month';
  t: ReturnType<typeof useTranslations>;
}) {
  const { cognitiveDistortionsTotal, reframedCount, topDistortion } = metrics;
  const pct =
    cognitiveDistortionsTotal > 0
      ? Math.round((reframedCount / cognitiveDistortionsTotal) * 100)
      : 0;

  if (cognitiveDistortionsTotal === 0) {
    return (
      <Card className="flex flex-col gap-3 p-[18px]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#C4856F]" />
            <p className="text-[17px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">
              {t('noticingTitle')}
            </p>
          </div>
          <p className="text-[13px] italic text-[#9A8880] dark:text-[#7A706A]">
            {t('noticingSubtitle')}
          </p>
        </div>
        <p className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">{t('noticingEmpty')}</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3.5 p-[18px]">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#C4856F]" />
          <p className="text-[17px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">
            {t('noticingTitle')}
          </p>
        </div>
        <p className="text-[13px] italic text-[#9A8880] dark:text-[#7A706A]">
          {t('noticingSubtitle')}
        </p>
      </div>

      {/* Stat boxes */}
      <div className="flex gap-3">
        {/* Left — thoughts caught */}
        <div className="flex flex-1 flex-col gap-1.5 rounded-[14px] bg-[#FFF5EC] p-3.5 dark:bg-[#2A211B]">
          <div className="flex items-center justify-between">
            <p className="text-[34px] font-bold leading-none text-[#C4856F]">
              {cognitiveDistortionsTotal}
            </p>
          </div>
          <p className="text-[11px] leading-snug text-[#9A8880] dark:text-[#7A706A]">
            {t(period === 'week' ? 'noticingCaughtWeek' : 'noticingCaughtMonth')}
          </p>
        </div>
        {/* Right — reframed */}
        <div className="flex flex-1 flex-col gap-1 rounded-[14px] bg-[#F0F5EE] p-3.5 dark:bg-[#1A2E1C]">
          <p className="text-[34px] font-bold leading-none text-[#7A9E7E]">{reframedCount}</p>
          <p className="text-[11px] leading-snug text-[#9A8880] dark:text-[#7A706A]">
            {t('noticingReframed')}
          </p>
          {cognitiveDistortionsTotal > 0 && (
            <p className="text-[10px] text-[#9A8880] dark:text-[#7A706A]">
              {t('noticingOfCaught', { pct })}
            </p>
          )}
        </div>
      </div>

      {/* Most common pattern */}
      {topDistortion && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[#9A8880] dark:text-[#7A706A]">
            {t('noticingMostCommon')}
          </span>
          <div className="flex items-center gap-1 rounded-[10px] border border-[#F5E4D7] bg-[#FDF2EA] px-2 py-1 dark:border-[#3A2820] dark:bg-[#2A211B]">
            <Brain className="h-2.5 w-2.5 text-[#C4856F]" />
            <span className="text-[11px] font-semibold text-[#C4856F]">{topDistortion}</span>
          </div>
          <Info className="h-3 w-3 text-[#B0A098]" />
        </div>
      )}
    </Card>
  );
}

function TopEmotionsCard({
  metrics,
  locale,
  t,
}: {
  metrics: DashboardMetrics;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { topEmotions } = metrics;
  const totalEmotions = topEmotions.reduce((s, e) => s + e.count, 0);
  const topThree = topEmotions.slice(0, 3);

  return (
    <Card className="flex flex-col gap-0 p-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Heart className="h-3.5 w-3.5 text-[#C4856F]" />
        <p className="text-[14px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">
          {t('topEmotionsTitle')}
        </p>
      </div>
      {topThree.length === 0 ? (
        <p className="text-[12px] text-[#9A8880] dark:text-[#7A706A]">—</p>
      ) : (
        topThree.map((e, i) => (
          <div
            key={e.emotion}
            className="flex items-center gap-2 border-t border-[#F0E4DE] py-[6px] first:border-0 dark:border-[#3A332E]"
          >
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: EMOTION_COLORS[i] }} />
            <span className="flex-1 truncate text-[13px] text-[#2B2320] dark:text-[#E8E0D8]">
              {localizeEmotion(e.emotion, locale)}
            </span>
            <span className="shrink-0 text-[12px] text-[#9A8880] dark:text-[#7A706A]">
              {totalEmotions > 0 ? `${Math.round((e.count / totalEmotions) * 100)}%` : '—'}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}

function TriggersCard({
  metrics,
  locale,
  t,
}: {
  metrics: DashboardMetrics;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { topTriggers } = metrics;
  const totalTriggers = topTriggers.reduce((s, tr) => s + tr.count, 0);

  if (topTriggers.length === 0) return null;

  return (
    <Card className="flex flex-col gap-0 p-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-[#C4856F]" />
        <p className="text-[14px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">
          {t('triggersTitle')}
        </p>
      </div>
      {topTriggers.map((trigger) => {
        const Icon = getTriggerIcon(trigger.trigger);
        return (
          <div
            key={trigger.trigger}
            className="flex items-center gap-2.5 border-t border-[#F0E4DE] py-[7px] first:border-0 dark:border-[#3A332E]"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#9A8880] dark:text-[#7A706A]" />
            <span className="flex-1 text-[13px] leading-snug text-[#2B2320] dark:text-[#E8E0D8]">
              {trigger.trigger}
            </span>
            <span className="shrink-0 text-[12px] text-[#9A8880] dark:text-[#7A706A]">
              {triggerFreq(trigger.count, totalTriggers, locale)}
            </span>
          </div>
        );
      })}
    </Card>
  );
}

function SessionRhythmCard({
  metrics,
  t,
}: {
  metrics: DashboardMetrics;
  t: ReturnType<typeof useTranslations>;
}) {
  const { sessionCount, avgDurationMins, sessionsPerWeek } = metrics;
  const maxCount = Math.max(...sessionsPerWeek.map((w) => w.count), 1);
  const activeWeeks = sessionsPerWeek.filter((w) => w.count > 0).length;

  const rhythmKey =
    activeWeeks >= 4
      ? 'sessionRhythmConsistent'
      : activeWeeks >= 2
        ? 'sessionRhythmBuilding'
        : 'sessionRhythmStarting';

  if (sessionCount === 0) {
    return (
      <Card className="flex flex-col gap-3 p-[22px] pb-5">
        <Eyebrow>{t('sessionRhythmEyebrow')}</Eyebrow>
        <p className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">{t('sessionRhythmEmpty')}</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3.5 p-[22px] pb-5">
      <Eyebrow>{t('sessionRhythmEyebrow')}</Eyebrow>
      <p className="text-[22px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">{t(rhythmKey)}</p>
      <p className="text-[13px] font-medium text-[#9A8880] dark:text-[#7A706A]">
        {t('sessionRhythmStat', { sessions: sessionCount, minutes: avgDurationMins || '—' })}
      </p>

      {/* Horizontal week bars */}
      {sessionsPerWeek.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {sessionsPerWeek.map((week) => (
            <div key={week.weekNumber} className="flex items-center gap-2.5">
              <span className="shrink-0 whitespace-nowrap text-[12px] font-medium text-[#9A8880] dark:text-[#7A706A]">
                {t('weekLabel', { n: week.weekNumber })}
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-[4px] bg-[#F0E4DE] dark:bg-[#3A332E]">
                <div
                  className="absolute inset-y-0 left-0 rounded-[4px] bg-[#C4856F] transition-all duration-700"
                  style={{ width: `${(week.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-4 shrink-0 text-right text-[12px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">
                {week.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Insight */}
      {activeWeeks >= 2 && (
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 shrink-0 text-[#9A8880]" />
          <p className="text-[12px] font-medium italic text-[#9A8880] dark:text-[#7A706A]">
            {t('sessionRhythmInsight', { weeks: activeWeeks })}
          </p>
        </div>
      )}
    </Card>
  );
}

function ThemesCard({
  metrics,
  t,
}: {
  metrics: DashboardMetrics;
  t: ReturnType<typeof useTranslations>;
}) {
  const { topTopics } = metrics;

  return (
    <Card className="flex flex-col gap-3.5 p-[22px] pb-5">
      <Eyebrow>{t('themesEyebrow')}</Eyebrow>
      <p className="text-[20px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">{t('themesTitle')}</p>
      {topTopics.length === 0 ? (
        <p className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">{t('themesEmpty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {topTopics.map((topic, i) => (
            <div key={topic.topic} className="flex items-center gap-2.5">
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: THEME_COLORS[i % THEME_COLORS.length] }}
              />
              <span className="text-[14px] font-medium text-[#2B2320] dark:text-[#E8E0D8]">
                {topic.topic}{' '}
                <span className="font-normal text-[#9A8880] dark:text-[#7A706A]">
                  ({topic.count})
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MiraCard({
  period,
  locale,
  fallbackInsight,
  metrics,
  onContinue,
  t,
}: {
  period: 'week' | 'month';
  locale: string;
  fallbackInsight: string | null;
  metrics: DashboardMetrics | undefined;
  onContinue: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const { data, isLoading } = useMiraOverview(period, locale);
  const text = data?.text ?? fallbackInsight;
  const isRu = locale === 'ru';
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const lines: string[] = [];

    const periodLabel = isRu
      ? period === 'week' ? 'Синтез за неделю' : 'Синтез за месяц'
      : period === 'week' ? 'Weekly Synthesis' : 'Monthly Synthesis';
    lines.push(`📊 ${periodLabel}`);

    if (text) {
      lines.push('');
      lines.push(text);
    }

    const hasStats =
      metrics?.averageAnxiety != null ||
      (metrics?.topEmotions.length ?? 0) > 0 ||
      (metrics?.topTopics.length ?? 0) > 0;

    if (hasStats) {
      lines.push('');
      lines.push('──────');
      if (metrics?.averageAnxiety != null)
        lines.push(`📈 ${isRu ? 'Тревога' : 'Anxiety'}: ${metrics.averageAnxiety}/10`);
      if (metrics?.topEmotions.length)
        lines.push(
          `🎭 ${isRu ? 'Эмоции' : 'Emotions'}: ${metrics.topEmotions.slice(0, 3).map((e) => localizeEmotion(e.emotion, locale)).join(', ')}`,
        );
      if (metrics?.topTopics.length)
        lines.push(
          `💬 ${isRu ? 'Темы' : 'Topics'}: ${metrics.topTopics.slice(0, 3).map((t) => t.topic).join(', ')}`,
        );
    }

    lines.push('');
    lines.push('──────────────');
    lines.push(isRu ? 'Поделился(ась) через MindBridge' : 'Shared via MindBridge');
    lines.push(siteConfig.siteUrl);

    const shareText = lines.join('\n');
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareText;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text, metrics, period, locale, isRu]);

  return (
    <Card leftAccent className="flex flex-col gap-3 px-[22px] py-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[#C4856F]" />
        <span className="text-[13px] font-semibold text-[#C4856F]">{t('miraNoteBy')}</span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          <div className="h-2.5 w-full animate-pulse rounded-full bg-[#F0E4DE] dark:bg-[#3A332E]" />
          <div className="h-2.5 w-[85%] animate-pulse rounded-full bg-[#F0E4DE] dark:bg-[#3A332E]" />
          <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-[#F0E4DE] dark:bg-[#3A332E]" />
          <p className="text-[12px] italic text-[#9A8880] dark:text-[#7A706A]">{t('miraLoading')}</p>
        </div>
      ) : text ? (
        <p className="text-[14px] leading-relaxed text-[#2B2320] dark:text-[#E8E0D8]">{text}</p>
      ) : null}
      {!isLoading && text && (
        <div className="flex items-center gap-4">
          <button onClick={onContinue} className="shrink-0 whitespace-nowrap text-left text-[13px] font-medium text-[#C4856F]">
            {t('miraContinue')}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#9A8880] transition-colors hover:text-[#C4856F] dark:text-[#7A706A]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#7A9E7E]" />
                <span className="text-[#7A9E7E]">{isRu ? 'Скопировано!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                {isRu ? 'Поделиться' : 'Share'}
              </>
            )}
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const from = useMemo(
    () => startOfDay(subDays(new Date(), period === 'week' ? 7 : 30)).toISOString(),
    [period],
  );

  const { data: metrics } = useMoodMetrics(from);
  const hasAnyData = (metrics?.analyses.length ?? 0) > 0 || (metrics?.sessionCount ?? 0) > 0;

  const handleContinueFromSynthesis = useCallback(async () => {
    const isRu = locale === 'ru';
    const periodText = isRu
      ? period === 'week' ? 'эту неделю' : 'этот месяц'
      : period === 'week' ? 'this week' : 'this month';

    const parts: string[] = [];
    if (isRu) {
      parts.push(`Привет! Только что прочитал(а) свой синтез за ${periodText}.`);
      if (metrics?.averageAnxiety != null)
        parts.push(`Средний уровень тревоги был ${metrics.averageAnxiety}/10.`);
      if (metrics?.topEmotions.length)
        parts.push(`Основные эмоции: ${metrics.topEmotions.slice(0, 2).map((e) => localizeEmotion(e.emotion, locale)).join(', ')}.`);
      if (metrics?.topTopics.length)
        parts.push(`Главные темы: ${metrics.topTopics.slice(0, 2).map((t) => t.topic).join(', ')}.`);
      parts.push('Хочу поговорить об этом.');
    } else {
      parts.push(`Hi! I just read my synthesis for ${periodText}.`);
      if (metrics?.averageAnxiety != null)
        parts.push(`Average anxiety level was ${metrics.averageAnxiety}/10.`);
      if (metrics?.topEmotions.length)
        parts.push(`Main emotions: ${metrics.topEmotions.slice(0, 2).map((e) => localizeEmotion(e.emotion, locale)).join(', ')}.`);
      if (metrics?.topTopics.length)
        parts.push(`Key topics: ${metrics.topTopics.slice(0, 2).map((t) => t.topic).join(', ')}.`);
      parts.push("I'd like to talk about it.");
    }

    sessionStorage.setItem('chatSeedMessage', parts.join(' '));
    const session = await createSession();
    analytics.sessionStarted(session.id);
    router.push(`/dashboard/chat/${session.id}`);
  }, [locale, period, metrics, router]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFF8F0] pb-24 dark:bg-[#1A1714]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#FFF8F0] px-5 pb-3 pt-4 dark:bg-[#1A1714]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[26px] font-bold text-[#2D1B14] dark:text-[#E8E0D8]">
              {t('analyticsPageTitle')}
            </h1>
            {metrics && (
              <p className="text-[13px] font-medium text-[#8B6B5E] dark:text-[#7A706A]">
                {t('analyticsDaysLabel', {
                  count: metrics.totalDays || metrics.sessionCount || 0,
                })}
              </p>
            )}
          </div>

          {/* Week / Month pill */}
          <div className="flex items-center gap-0.5 rounded-[22px] border border-[#F0E4DE] bg-white p-1 dark:border-[#3A332E] dark:bg-[#221E1B]">
            <button
              onClick={() => setPeriod('week')}
              className={cn(
                'rounded-[18px] px-3.5 py-[7px] text-[13px] font-semibold transition-colors',
                period === 'week' ? 'bg-[#C4856F] text-white' : 'text-[#8B6B5E] dark:text-[#7A706A]',
              )}
            >
              {t('week')}
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={cn(
                'rounded-[18px] px-3.5 py-[7px] text-[13px] font-semibold transition-colors',
                period === 'month' ? 'bg-[#C4856F] text-white' : 'text-[#8B6B5E] dark:text-[#7A706A]',
              )}
            >
              {t('month')}
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 px-5 pb-4">
        {!hasAnyData ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Sparkles className="h-10 w-10 text-[#C4856F] opacity-40" />
            <p className="text-[17px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">
              {t('noDataYet')}
            </p>
            <p className="text-[14px] text-[#9A8880] dark:text-[#7A706A]">{t('noDataDesc')}</p>
          </div>
        ) : (
          <>
            {(metrics?.analyses.length ?? 0) > 0 && (
              <WellbeingCard analyses={metrics!.analyses} period={period} t={t} />
            )}

            {(metrics?.analyses.length ?? 0) > 0 && (
              <MoodJourneyCard analyses={metrics!.analyses} period={period} locale={locale} t={t} />
            )}

            {metrics && <NoticingCard metrics={metrics} period={period} t={t} />}

            {metrics && metrics.topEmotions.length > 0 && (
              <TopEmotionsCard metrics={metrics} locale={locale} t={t} />
            )}

            {metrics && metrics.topTriggers.length > 0 && (
              <TriggersCard metrics={metrics} locale={locale} t={t} />
            )}

            {metrics && <SessionRhythmCard metrics={metrics} t={t} />}

            {metrics && metrics.topTopics.length > 0 && <ThemesCard metrics={metrics} t={t} />}

            {(metrics?.sessionCount ?? 0) > 0 && (
              <MiraCard
                period={period}
                locale={locale}
                fallbackInsight={metrics?.latestInsight ?? null}
                metrics={metrics}
                onContinue={handleContinueFromSynthesis}
                t={t}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
