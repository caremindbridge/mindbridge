'use client';

import type { SessionAnalysisDto } from '@mindbridge/types/src/chat';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { useUsageStatus } from '@/entities/subscription';
import { Badge, Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface ExtendedAnalysis extends SessionAnalysisDto {
  moodInsight?: string | null;
  patientSummary?: string | null;
  keyEmotions?: string[];
  keyTopics?: string[];
  riskFlags?: string | null;
}

interface Props {
  analysis: ExtendedAnalysis;
  sessionId: string;
}

const CLINICAL_KEYWORDS = [
  'psychiatric', 'inpatient', 'hospitalization', 'hospitalize',
  'emergency department', 'medical evaluation', 'suicide risk', 'crisis intervention',
  'психиатр', 'госпитализац', 'скорую помощь', 'стационар',
];

function isClinicianOnly(rec: string): boolean {
  const lower = rec.toLowerCase();
  return CLINICAL_KEYWORDS.some((kw) => lower.includes(kw));
}

// Backward-compat: replace clinical third-person "пациент" in old analyses
function humanizeText(text: string): string {
  if (!text) return text;
  return text
    .replace(/пациент[уаоеёюяи]?\s/gi, 'ты ')
    .replace(/^пациент[уаоеёюяи]?$/gi, 'ты');
}

const FRIENDLY_DISTORTION_NAMES: Record<string, string> = {
  'Catastrophizing': 'Мысль-катастрофа',
  'Катастрофизация': 'Мысль-катастрофа',
  'All-or-Nothing Thinking': '"Всё или ничего"',
  'Чёрно-белое мышление': '"Всё или ничего"',
  'Should Statements': '"Должен"',
  'Долженствование': '"Должен"',
  'Overgeneralization': 'Обобщение',
  'Сверхобобщение': 'Обобщение',
  'Fortune Telling': 'Предсказание',
  'Предсказание будущего': 'Предсказание',
  'Personalization': 'Всё из-за меня',
  'Персонализация': 'Всё из-за меня',
  'Mental Filter': 'Фильтр негатива',
  'Ментальный фильтр': 'Фильтр негатива',
  'Discounting the Positive': 'Обесценивание',
  'Disqualifying the Positive': 'Обесценивание',
  'Обесценивание позитивного': 'Обесценивание',
  'Labeling': 'Ярлыки',
  'Навешивание ярлыков': 'Ярлыки',
  'Mind Reading': 'Чтение мыслей',
  'Чтение мыслей': 'Чтение мыслей',
  'Jumping to Conclusions': 'Поспешный вывод',
  'Поспешные выводы': 'Поспешный вывод',
  'Emotional Reasoning': 'Чувство = факт',
  'Эмоциональное рассуждение': 'Чувство = факт',
};

const EMOTION_KEYS: Record<string, string> = {
  anxiety: 'emotionAnxiety', sadness: 'emotionSadness', joy: 'emotionJoy',
  calm: 'emotionCalm', irritation: 'emotionIrritation', fear: 'emotionFear',
  anger: 'emotionAnger', hope: 'emotionHope', loneliness: 'emotionLoneliness',
  gratitude: 'emotionGratitude',
};

export function PatientSessionSummary({ analysis, sessionId }: Props) {
  const t = useTranslations('sessionSummary');
  const tm = useTranslations('mood');
  const tp = useTranslations('pricing');

  const { data: usage } = useUsageStatus();
  const isLitePlan = !usage?.plan || usage.plan === 'lite' || usage.plan === 'trial';

  const ext = analysis as ExtendedAnalysis;

  const miraMessage =
    (ext.patientSummary && ext.patientSummary.length >= 20)
      ? ext.patientSummary
      : (ext.moodInsight && ext.moodInsight.length >= 20)
        ? ext.moodInsight
        : t('defaultMessage');

  const patientRecs = (analysis.recommendations ?? []).filter((r) => !isClinicianOnly(r));

  const emotions = (ext.keyEmotions ?? []).map((key) => {
    const k = EMOTION_KEYS[key];
    return k ? tm(k as Parameters<typeof tm>[0]) : key;
  });

  return (
    <div className="flex flex-col gap-3 overflow-y-auto px-4 pt-4 pb-28 sm:h-full sm:overflow-hidden sm:p-6">

      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/chat">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('backToSessions')}
          </Link>
        </Button>
        <h1 className="text-base font-semibold">{t('title')}</h1>
      </div>

      {/* ── Mira's message ── */}
      <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base">
            🌿
          </div>
          <div>
            <p className="mb-0.5 text-xs font-medium text-primary">{t('miraMessage')}</p>
            <p className="text-sm leading-relaxed">{miraMessage}</p>
          </div>
        </div>
      </div>

      {/* ── Tile grid ── */}
      <div className="grid grid-cols-1 gap-3 sm:min-h-0 sm:flex-1 sm:grid-cols-3 sm:grid-rows-2">

        {/* Topics */}
        <Tile title={t('whatWeDiscussed')} icon="💬">
          <div className="flex flex-wrap gap-1.5">
            {(ext.keyTopics ?? []).length > 0
              ? ext.keyTopics!.map((topic, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))
              : <Empty />}
          </div>
        </Tile>

        {/* Mood */}
        <Tile title={t('yourMood')} icon="🫀">
          <div className="flex flex-wrap gap-1.5">
            {emotions.length > 0
              ? emotions.map((e, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs capitalize"
                  >
                    {e}
                  </span>
                ))
              : <Empty />}
          </div>
        </Tile>

        {/* Progress */}
        <Tile title={t('progressNote')} icon="✨" scrollable>
          <p className="text-xs leading-relaxed text-foreground/80">
            {humanizeText(analysis.progressSummary) || '—'}
          </p>
        </Tile>

        {/* What we noticed — col-span-2 */}
        <Tile
          title={t('whatWeNoticed')}
          icon="💡"
          className="sm:col-span-2"
          accent
          scrollable
        >
          {analysis.cognitiveDistortions.length > 0 ? (
            <div className="space-y-3">
              {analysis.cognitiveDistortions.map((d, i) => {
                const friendlyName = FRIENDLY_DISTORTION_NAMES[d.type] ?? d.type;
                return (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="mt-0.5 shrink-0">{i === 0 ? '💡' : '🔄'}</span>
                    <div>
                      <p className="mb-0.5 font-medium">{friendlyName}</p>
                      <p className={cn('leading-relaxed text-foreground/80', isLitePlan && 'select-none blur-[3px]')}>
                        {d.description}
                      </p>
                      {d.example && (
                        <p className={cn('mt-0.5 italic text-muted-foreground', isLitePlan && 'select-none blur-[3px]')}>
                          &ldquo;{d.example}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty />
          )}
        </Tile>

        {/* What to try + homework */}
        <Tile
          title={t('whatToTry')}
          icon="🎯"
          scrollable
          lockedOverlay={isLitePlan ? (
            <div className="flex flex-col items-center gap-2 px-3 text-center">
              <span className="text-lg">🔒</span>
              <p className="text-[11px] font-medium text-foreground/80">{t('lockedRecommendations')}</p>
              <Button size="sm" variant="soft" asChild className="mt-1 h-7 text-xs">
                <Link href="/pricing">{tp('upgradeTo')}</Link>
              </Button>
            </div>
          ) : undefined}
        >
          {patientRecs.length > 0 || (analysis.homework?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {patientRecs.map((r, i) => (
                <div key={i} className="flex gap-1.5 text-xs">
                  <span className="mt-0.5 shrink-0 text-primary">•</span>
                  <span>{humanizeText(r)}</span>
                </div>
              ))}
              {(analysis.homework ?? []).map((item, i) => (
                <div key={`hw-${i}`} className="flex gap-1.5 text-xs">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">{i + 1}.</span>
                  <span>{humanizeText(item)}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Tile>
      </div>

      {/* ── Bottom bar ── */}
      <div className="shrink-0 space-y-2">
        {ext.riskFlags && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs dark:border-amber-800 dark:bg-amber-950/30">
            <span className="font-medium text-amber-800 dark:text-amber-200">{t('needHelp')} </span>
            <span className="text-amber-700 dark:text-amber-300">{t('crisisLine')}</span>
          </div>
        )}
        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href="/dashboard/chat">{t('newSession')}</Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard">{t('toDashboard')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Tile({
  title,
  icon,
  children,
  className,
  accent,
  scrollable,
  lockedOverlay,
}: {
  title: string;
  icon: string;
  children: ReactNode;
  className?: string;
  accent?: boolean;
  scrollable?: boolean;
  lockedOverlay?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col rounded-xl border p-4 shadow-sm',
        accent ? 'border-blush-200 bg-blush-50/50' : 'bg-card',
        className,
      )}
    >
      <div className="mb-2 flex shrink-0 items-center gap-1.5">
        <span className="text-sm leading-none">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <div className={cn('relative flex-1', scrollable && 'sm:overflow-y-auto', lockedOverlay && 'min-h-[90px]')}>
        {children}
        {lockedOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg backdrop-blur-[6px] bg-background/60">
            {lockedOverlay}
          </div>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return <span className="text-xs text-muted-foreground">—</span>;
}
