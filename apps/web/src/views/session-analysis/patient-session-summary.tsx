'use client';

import type { SessionAnalysisDto } from '@mindbridge/types/src/chat';
import {
  ArrowRight,
  Brain,
  Check,
  ChevronLeft,
  Clock3,
  Frown,
  GitBranch,
  Hash,
  Heart,
  MessageCircle,
  NotebookPen,
  Phone,
  Repeat2,
  Share2,
  Smile,
  Sprout,
  TriangleAlert,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

import { useSession } from '@/entities/session';
import { createSession } from '@/shared/api/client';
import { analytics } from '@/shared/lib/analytics';
import { siteConfig } from '@/shared/lib/site-config';
import { cn } from '@/shared/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  analysis: SessionAnalysisDto;
  sessionId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EMOTION_KEYS: Record<string, string> = {
  anxiety: 'emotionAnxiety', sadness: 'emotionSadness', joy: 'emotionJoy',
  calm: 'emotionCalm', irritation: 'emotionIrritation', fear: 'emotionFear',
  anger: 'emotionAnger', hope: 'emotionHope', loneliness: 'emotionLoneliness',
  gratitude: 'emotionGratitude',
};

const EMOTION_EMOJI: Record<string, string> = {
  anxiety: '😰', sadness: '😢', joy: '😊', calm: '😌',
  irritation: '😤', fear: '😨', anger: '😠', hope: '🤞',
  loneliness: '😔', gratitude: '🙏',
};

const POSITIVE_EMOTIONS = new Set(['joy', 'calm', 'hope', 'gratitude']);

const POSITIVE_MOOD_OUTCOMES = new Set([
  'Feeling better', 'Calmer', 'Hopeful', 'Motivated', 'Grateful', 'Relaxed', 'Empowered',
]);

const MOOD_OUTCOME_KEYS: Record<string, string> = {
  'Feeling better': 'outcomeBetter',
  'Calmer': 'outcomeCalmer',
  'Hopeful': 'outcomeHopeful',
  'Motivated': 'outcomeMotivated',
  'Grateful': 'outcomeGrateful',
  'Relaxed': 'outcomeRelaxed',
  'Empowered': 'outcomeEmpowered',
  'Reflected': 'outcomeReflected',
  'Exploring': 'outcomeExploring',
  'Processing': 'outcomeProcessing',
  'Opened up': 'outcomeOpenedUp',
  'Working through it': 'outcomeWorkingThrough',
  'Sitting with it': 'outcomeSittingWith',
  'First steps': 'outcomeFirstSteps',
};

const TOPIC_ICONS = [Brain, Repeat2, Heart, Brain, Repeat2, Heart];

const CLINICAL_KEYWORDS = [
  'psychiatric', 'inpatient', 'hospitalization', 'hospitalize',
  'emergency department', 'medical evaluation', 'suicide risk', 'crisis intervention',
  'психиатр', 'госпитализац', 'скорую помощь', 'стационар',
];

const PROGRESS_METRIC_KEYS: Record<string, string> = {
  'Openness': 'progressMetricOpenness',
  'Self-Awareness': 'progressMetricSelfAwareness',
  'Resilience': 'progressMetricResilience',
  'Emotional Clarity': 'progressMetricEmotionalClarity',
  'Engagement': 'progressMetricEngagement',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function humanizeText(text: string): string {
  if (!text) return text;
  return text
    .replace(/пациент[уаоеёюяи]?\s/gi, 'ты ')
    .replace(/^пациент[уаоеёюяи]?$/gi, 'ты');
}

function isClinicianOnly(rec: string): boolean {
  const lower = rec.toLowerCase();
  return CLINICAL_KEYWORDS.some((kw) => lower.includes(kw));
}

function intensityKey(v: number): 'strong' | 'high' | 'moderate' | 'mild' | 'slight' {
  if (v >= 8) return 'strong';
  if (v >= 6) return 'high';
  if (v >= 4) return 'moderate';
  if (v >= 2) return 'mild';
  return 'slight';
}

function progressLevel(value: number): { labelKey: string; color: string; barColor: string } {
  if (value >= 70) return { labelKey: 'progressLevelStrong', color: '#7A9E7E', barColor: '#C4856F' };
  if (value >= 50) return { labelKey: 'progressLevelGrowing', color: '#C4856F', barColor: '#D4A08C' };
  return { labelKey: 'progressLevelDeveloping', color: '#9A8880', barColor: '#E8C4B8' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[14px]">{emoji}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#9A8880] dark:text-[#7A706A]">
        {label}
      </span>
    </div>
  );
}

function MiraCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[20px] bg-white shadow-[0_4px_16px_#0000000D] dark:bg-[#221E1B] dark:shadow-[0_4px_16px_#00000033]', className)}>
      {children}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[20px] bg-white shadow-[0_2px_12px_#2B232009] dark:bg-[#221E1B] dark:shadow-[0_2px_12px_#00000025]', className)}>
      {children}
    </div>
  );
}

function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-[#F0E4DE] dark:bg-[#3A332E]', className)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function PatientSessionSummary({ analysis, sessionId }: Props) {
  const t = useTranslations('sessionSummary');
  const tm = useTranslations('mood');
  const locale = useLocale();
  const isRu = locale === 'ru';
  const router = useRouter();
  const { data: session } = useSession(sessionId);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Duration ──
  const duration = useMemo(() => {
    if (!session) return null;
    const start = new Date(session.createdAt).getTime();
    const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
    const mins = Math.max(1, Math.round((end - start) / 60000));
    if (mins < 60) return `${mins} ${t('minutes')}`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} ${t('hours')}` : `${h} ${t('hours')} ${m} ${t('minutes')}`;
  }, [session, t]);

  // ── Mira message ──
  const miraMessage = useMemo(() => {
    if (analysis.patientSummary && analysis.patientSummary.length >= 20) return analysis.patientSummary;
    if (analysis.moodInsight && analysis.moodInsight.length >= 20) return analysis.moodInsight;
    return t('defaultMessage');
  }, [analysis.patientSummary, analysis.moodInsight, t]);

  // ── Emotional state ──
  const primaryTrack = useMemo(
    () => [...(analysis.emotionalTrack ?? [])].sort((a, b) => b.intensity - a.intensity)[0] ?? null,
    [analysis.emotionalTrack],
  );
  const primaryKey = analysis.keyEmotions?.[0] ?? null;
  const secondaryKeys = (analysis.keyEmotions ?? []).slice(1);

  // Map each emotion name → max intensity from emotionalTrack
  const secondaryTrackMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of analysis.emotionalTrack ?? []) {
      const key = entry.emotion.toLowerCase();
      const existing = map.get(key) ?? 0;
      if (entry.intensity > existing) map.set(key, entry.intensity);
    }
    return map;
  }, [analysis.emotionalTrack]);

  const getEmotionLabel = (key: string) => {
    const k = EMOTION_KEYS[key.toLowerCase()];
    return k ? tm(k as Parameters<typeof tm>[0]) : key.charAt(0).toUpperCase() + key.slice(1);
  };

  const getMoodOutcomeLabel = (outcome: string) => {
    const key = MOOD_OUTCOME_KEYS[outcome];
    return key ? t(key as Parameters<typeof t>[0]) : outcome;
  };

  // ── Mood shift display ──
  const hasPrimaryEmotion = primaryKey != null || primaryTrack != null;
  const isAfterPositive = analysis.moodOutcome != null && POSITIVE_MOOD_OUTCOMES.has(analysis.moodOutcome);
  const showMoodShift = hasPrimaryEmotion && isAfterPositive;
  const beforeLabel = primaryKey ? getEmotionLabel(primaryKey) : (primaryTrack?.emotion ?? '');
  const afterLabel = analysis.moodOutcome ? getMoodOutcomeLabel(analysis.moodOutcome) : '';
  const isBeforePositive = primaryKey ? POSITIVE_EMOTIONS.has(primaryKey) : false;

  // ── Topics ──
  const topics = useMemo(
    () => (analysis.keyTopics?.length ? analysis.keyTopics : (analysis.themes ?? [])).slice(0, 6),
    [analysis.keyTopics, analysis.themes],
  );

  // ── Positive observations & patterns combined ──
  const positiveObservations = analysis.positiveObservations ?? [];
  const hasPatterns = analysis.cognitiveDistortions.length > 0 || positiveObservations.length > 0;

  // ── Progress metrics ──
  const progressMetrics = analysis.progressMetrics ?? [];

  const getMetricLabel = (label: string) => {
    const key = PROGRESS_METRIC_KEYS[label];
    return key ? t(key as Parameters<typeof t>[0]) : label;
  };

  // ── Recommendations ──
  const patientRecs = useMemo(
    () => (analysis.recommendations ?? []).filter((r) => !isClinicianOnly(r)),
    [analysis.recommendations],
  );

  const handleNewSession = useCallback(async () => {
    setStarting(true);
    try {
      const s = await createSession();
      analytics.sessionStarted(s.id);
      router.push(`/dashboard/chat/${s.id}`);
    } catch {
      setStarting(false);
    }
  }, [router]);

  const handleShare = useCallback(async () => {
    const lines: string[] = [];

    // ── Header ──
    const num = analysis.sessionNumber ? `#${analysis.sessionNumber} ` : '';
    const title = session?.title ?? (isRu ? 'Сессия' : 'Session');
    lines.push(`📋 ${isRu ? 'Сессия' : 'Session'} ${num}— ${title}`);

    if (session) {
      const dateStr = new Intl.DateTimeFormat(isRu ? 'ru-RU' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(new Date(session.createdAt));
      const dur = duration ? ` · ${duration}` : '';
      lines.push(`${dateStr}${dur}`);
    }

    // ── Mira's message ──
    if (miraMessage && miraMessage !== t('defaultMessage')) {
      lines.push('');
      lines.push(`💬 ${isRu ? 'Мира:' : 'Mira:'} ${miraMessage}`);
    }

    // ── Primary emotion ──
    if (primaryKey || primaryTrack) {
      lines.push('');
      lines.push(`🎭 ${isRu ? 'Основная эмоция' : 'Primary emotion'}`);
      const emoLabel = primaryKey ? getEmotionLabel(primaryKey) : (primaryTrack?.emotion ?? '');
      const iKey = primaryTrack ? intensityKey(primaryTrack.intensity) : null;
      const iLabel = iKey
        ? t(`intensity${iKey.charAt(0).toUpperCase() + iKey.slice(1)}` as Parameters<typeof t>[0])
        : null;
      lines.push(iLabel ? `${emoLabel} · ${iLabel}` : emoLabel);

      if (secondaryKeys.length > 0) {
        const secParts = secondaryKeys.map((k) => {
          const label = getEmotionLabel(k);
          const isPos = POSITIVE_EMOTIONS.has(k);
          const intens = secondaryTrackMap.get(k.toLowerCase());
          if (isPos) return `${label} (${t('growing').toLowerCase()})`;
          if (intens != null) {
            const ik = intensityKey(intens);
            const il = t(`intensity${ik.charAt(0).toUpperCase() + ik.slice(1)}` as Parameters<typeof t>[0]);
            return `${label} (${il.toLowerCase()})`;
          }
          return label;
        });
        lines.push(`${isRu ? 'Также:' : 'Also:'} ${secParts.join(', ')}`);
      }
    }

    // ── Progress metrics ──
    if (progressMetrics.length > 0) {
      lines.push('');
      lines.push(`📈 ${isRu ? 'Прогресс' : 'Progress'}`);
      for (const m of progressMetrics) {
        const lvl = progressLevel(m.value);
        lines.push(`• ${getMetricLabel(m.label)} — ${t(lvl.labelKey as Parameters<typeof t>[0])}`);
      }
    }

    // ── Patterns (negative + positive) ──
    if (analysis.cognitiveDistortions.length > 0 || positiveObservations.length > 0) {
      lines.push('');
      lines.push(`🔍 ${isRu ? 'Паттерны' : 'Patterns'}`);
      for (const d of analysis.cognitiveDistortions) lines.push(`• ${humanizeText(d.description)}`);
      for (const obs of positiveObservations) lines.push(`🌱 ${humanizeText(obs)}`);
    }

    // ── Topics ──
    if (topics.length > 0) {
      lines.push('');
      lines.push(`💬 ${isRu ? 'Темы' : 'Topics'}`);
      lines.push(topics.join(', '));
    }

    // ── Homework ──
    if ((analysis.homework?.length ?? 0) > 0) {
      lines.push('');
      lines.push(`🎯 ${isRu ? 'Домашние задания' : 'Homework'}`);
      (analysis.homework ?? []).forEach((item, i) => lines.push(`${i + 1}. ${humanizeText(item)}`));
    }

    // ── Footer ──
    lines.push('');
    lines.push('──────────────');
    lines.push(isRu ? 'Поделился(ась) через MindBridge' : 'Shared via MindBridge');
    lines.push(siteConfig.siteUrl);

    const text = lines.join('\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for older browsers / non-secure contexts
      const el = document.createElement('textarea');
      el.value = text;
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
  }, [
    analysis, session, duration, miraMessage, t, isRu,
    primaryKey, primaryTrack, secondaryKeys, secondaryTrackMap,
    progressMetrics, positiveObservations, topics,
    getEmotionLabel, getMetricLabel,
  ]);

  return (
    <div className="h-full overflow-y-auto bg-[#F7F3EE] dark:bg-[#1A1714]">
      {/* ── Nav header ── */}
      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={() => router.push('/dashboard/chat')} className="text-[#2B2320] dark:text-[#E8E0D8]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-[17px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">{t('title')}</span>
        <div className="w-5" />
      </div>

      {/* ── All cards ── */}
      <div className="flex flex-col gap-4 px-5 pb-8">

        {/* Mira card */}
        <MiraCard className="p-5">
          <div className="mb-3.5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F2E9] dark:bg-[#1A2E1C]">
              <Sprout className="h-[18px] w-[18px] text-[#4CAF50]" />
            </div>
            <span className="text-[13px] font-semibold text-[#C4856F]">{t('miraSays')}</span>
          </div>
          <p className="text-[14px] leading-[1.6] text-[#5C4A3D] dark:text-[#C8BFB8]">
            {humanizeText(miraMessage)}
          </p>
        </MiraCard>

        {/* Overview card */}
        <MiraCard className="flex flex-col gap-0 divide-y divide-[#F0E4DE] dark:divide-[#3A332E] p-5">

          {/* Duration row */}
          <div className="flex items-center justify-between pb-3.5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-[14px] w-[14px] text-[#C4856F]" />
              <span className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">{t('duration')}</span>
            </div>
            <span className="text-[13px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">{duration ?? '—'}</span>
          </div>

          {/* Topic row */}
          {session?.title && (
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-[14px] w-[14px] text-[#C4856F]" />
                <span className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">{t('topic')}</span>
              </div>
              <span className="max-w-[190px] truncate text-right text-[13px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">
                {session.title}
              </span>
            </div>
          )}

          {/* Session # row */}
          {analysis.sessionNumber != null && (
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2">
                <Hash className="h-[14px] w-[14px] text-[#C4856F]" />
                <span className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">{t('sessionLabel')}</span>
              </div>
              <span className="text-[13px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">
                #{analysis.sessionNumber}
              </span>
            </div>
          )}

          {/* Mood shift — before → after (only when outcome is clearly positive) */}
          {showMoodShift && (
            <div className="flex flex-col gap-3.5 pt-3.5">
              <span className="text-[13px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">{t('howYouFelt')}</span>
              <div className="flex items-start justify-center gap-6">
                <div className="flex w-[80px] flex-col items-center gap-2">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: isBeforePositive ? '#E8F2E9' : '#FFF0E0' }}
                  >
                    {isBeforePositive
                      ? <Smile className="h-6 w-6" style={{ color: '#4CAF50' }} />
                      : <Frown className="h-6 w-6" style={{ color: '#E8945A' }} />
                    }
                  </div>
                  <span className="text-center text-[12px] text-[#9A8880] dark:text-[#7A706A]">{beforeLabel}</span>
                </div>
                <ArrowRight className="mt-[12px] h-5 w-5 shrink-0 text-[#C4856F]" />
                <div className="flex w-[80px] flex-col items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F2E9] dark:bg-[#1A2E1C]">
                    <Smile className="h-6 w-6" style={{ color: '#4CAF50' }} />
                  </div>
                  <span className="text-center text-[12px] text-[#9A8880] dark:text-[#7A706A]">{afterLabel}</span>
                </div>
              </div>
            </div>
          )}

        </MiraCard>

        {/* Emotional State card */}
        {(primaryKey || primaryTrack) && (
          <Card className="p-5">
            <SectionLabel emoji="🎭" label={t('emotionalState')} />

            {/* Primary emotion */}
            <div className="mt-3.5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF0EB] text-xl dark:bg-[#352820]">
                {EMOTION_EMOJI[primaryKey?.toLowerCase() ?? ''] ?? '💭'}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[15px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">
                  {primaryKey ? getEmotionLabel(primaryKey) : (primaryTrack?.emotion ?? '')}
                </p>
                <p className="text-[12px] text-[#9A8880] dark:text-[#7A706A]">
                  {t('dominantEmotion')}
                  {primaryTrack && ` · ${t(`intensity${intensityKey(primaryTrack.intensity).charAt(0).toUpperCase() + intensityKey(primaryTrack.intensity).slice(1)}`)}`}
                </p>
              </div>
            </div>

            {/* Secondary emotions */}
            {secondaryKeys.length > 0 && (
              <>
                <Divider className="my-3.5" />
                <p className="text-[12px] font-medium text-[#9A8880] dark:text-[#7A706A]">{t('alsoDetected')}</p>
                <div className="mt-3.5 flex flex-col gap-3.5">
                  {secondaryKeys.map((key) => {
                    const isPositive = POSITIVE_EMOTIONS.has(key);
                    const intensity = secondaryTrackMap.get(key.toLowerCase());
                    const intensityLabel = isPositive
                      ? t('growing')
                      : intensity != null
                        ? t(`intensity${intensityKey(intensity).charAt(0).toUpperCase() + intensityKey(intensity).slice(1)}`)
                        : null;
                    return (
                      <div
                        key={key}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5',
                          isPositive ? 'bg-[#E8F2E9] dark:bg-[#1A2E1C]' : 'bg-[#F7F3EE] dark:bg-[#2E2824]',
                        )}
                      >
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: isPositive ? '#7A9E7E' : '#C4856F' }}
                        />
                        <span className="flex-1 text-[13px] font-medium text-[#5C4A3D] dark:text-[#C8BFB8]">
                          {getEmotionLabel(key)}
                        </span>
                        {intensityLabel && (
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: isPositive ? '#7A9E7E' : '#9A8880', fontWeight: isPositive ? 600 : 500 }}
                          >
                            {intensityLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        )}

        {/* Session Progress */}
        {progressMetrics.length > 0 && (
          <Card className="p-5">
            <SectionLabel emoji="📈" label={t('yourProgress')} />
            <div className="mt-4 flex flex-col gap-4">
              {progressMetrics.map((metric) => {
                const level = progressLevel(metric.value);
                return (
                  <div key={metric.label} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">
                        {getMetricLabel(metric.label)}
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: level.color }}>
                        {t(level.labelKey as Parameters<typeof t>[0])}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-[3px] bg-[#F0E4DE] dark:bg-[#3A332E]">
                      <div
                        className="h-full rounded-[3px]"
                        style={{ width: `${metric.value}%`, background: level.barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Patterns Noticed — negative distortions + positive observations combined */}
        {hasPatterns && (
          <Card className="p-5">
            <SectionLabel emoji="🔍" label={t('patternsNoticed')} />
            <div className="mt-3.5 flex flex-col gap-3">
              {analysis.cognitiveDistortions.map((d, i) => {
                const PatternIcon = i % 2 === 0 ? GitBranch : TriangleAlert;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl bg-[#F7F3EE] px-4 py-3 dark:bg-[#2E2824]"
                  >
                    <PatternIcon className="h-4 w-4 shrink-0 text-[#C4856F]" />
                    <p className="text-[13px] leading-[1.4] text-[#5C4A3D] dark:text-[#C8BFB8]">
                      {humanizeText(d.description)}
                    </p>
                  </div>
                );
              })}
              {positiveObservations.map((obs, i) => (
                <div
                  key={`pos-${i}`}
                  className="flex items-center gap-2.5 rounded-xl bg-[#E8F2E9] px-4 py-3 dark:bg-[#1A2E1C]"
                >
                  <Sprout className="h-4 w-4 shrink-0 text-[#7A9E7E]" />
                  <p className="text-[13px] leading-[1.4] text-[#5C4A3D] dark:text-[#C8BFB8]">{humanizeText(obs)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Topics Discussed */}
        {topics.length > 0 && (
          <Card className="p-5">
            <SectionLabel emoji="💬" label={t('whatWeDiscussed')} />
            <div className="mt-3.5 flex flex-col gap-3">
              {topics.map((topic, i) => {
                const TopicIcon = TOPIC_ICONS[i % TOPIC_ICONS.length];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl bg-[#F7F3EE] px-4 py-3 dark:bg-[#2E2824]"
                  >
                    <TopicIcon className="h-4 w-4 shrink-0 text-[#C4856F]" />
                    <p className="text-[13px] leading-[1.4] text-[#5C4A3D] dark:text-[#C8BFB8]">{topic}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* What You Can Try */}
        {(patientRecs.length > 0 || (analysis.homework?.length ?? 0) > 0) && (
          <Card className="p-5">
            <SectionLabel emoji="🎯" label={t('whatToTry')} />
            <div className="mt-3.5 flex flex-col gap-3.5">
              {patientRecs.map((r, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="mt-0.5 shrink-0 text-[14px] leading-none text-[#C4856F]">•</span>
                  <p className="text-[13px] leading-[1.5] text-[#5C4A3D] dark:text-[#C8BFB8]">{humanizeText(r)}</p>
                </div>
              ))}

              {(analysis.homework?.length ?? 0) > 0 && (
                <>
                  <Divider />
                  <div className="flex items-center gap-2">
                    <NotebookPen className="h-3.5 w-3.5 text-[#C4856F]" />
                    <span className="text-[13px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">{t('homeworkLabel')}</span>
                  </div>
                  {(analysis.homework ?? []).map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border border-[#F0E4DE] bg-[#FFF8F0] text-[12px] font-semibold text-[#C4856F] dark:border-[#3A332E] dark:bg-[#2A211B]">
                        {i + 1}
                      </div>
                      <p className="text-[13px] leading-[1.5] text-[#5C4A3D] dark:text-[#C8BFB8]">{humanizeText(item)}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        )}

        {/* Crisis banner */}
        {analysis.riskFlags && (
          <div className="flex items-center gap-2.5 rounded-[14px] border border-[#F0E4DE] bg-[#FFF8F0] px-4 py-3 dark:border-[#3A332E] dark:bg-[#2A211B]">
            <Phone className="h-4 w-4 shrink-0 text-[#C4856F]" />
            <p className="text-[12px] leading-[1.4] text-[#9A8880] dark:text-[#7A706A]">
              {t('crisisFull')}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={handleNewSession}
            disabled={starting}
            className="send-button-gradient flex h-12 w-full items-center justify-center rounded-[14px] text-sm font-bold text-white shadow-[0_4px_12px_#C4856F30] disabled:opacity-60"
          >
            {t('newSession')}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex h-12 w-full items-center justify-center rounded-[14px] border border-[#F0E4DE] bg-white text-sm font-semibold text-[#9A8880] dark:border-[#3A332E] dark:bg-[#221E1B] dark:text-[#7A706A]"
          >
            {t('toDashboard')}
          </button>
          <button
            onClick={handleShare}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-[#E8F2E9] bg-white text-sm font-semibold text-[#4CAF50] transition-colors dark:border-[#1A3820] dark:bg-[#221E1B]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                {isRu ? 'Скопировано!' : 'Copied!'}
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                {t('shareWithTherapist')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
