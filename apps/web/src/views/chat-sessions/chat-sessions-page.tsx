'use client';

import type { PaginatedSessionsDto, SessionCategory, SessionDto } from '@mindbridge/types/src/chat';
import { format, formatDistanceToNow, isToday, isYesterday, subDays } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import {
  Brain,
  Check,
  ChevronRight,
  Heart,
  Leaf,
  Loader2,
  MessageCircle,
  Plus,
  Sparkles,
  Sun,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useInfiniteSessions } from '@/entities/session';
import { createSession } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import { Button, Skeleton } from '@/shared/ui';

// ── Category config ──────────────────────────────────────────────────────────

type CategoryConfig = {
  icon: typeof Brain;
  iconColor: string;
  darkIconColor: string;
  bg: string;
  darkBg: string;
  tagBg: string;
  darkTagBg: string;
  tagText: string;
  darkTagText: string;
  // mood outcome pill uses category color, but with uniform dark bg per design
  moodText: string;
  darkMoodText: string;
  labelKey: string;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  // CBT — Blue (~220°): analytical, cognitive clarity
  cbt: {
    icon: Brain,
    iconColor: 'text-[#4A7FD4]',
    darkIconColor: 'dark:text-[#7AAAF0]',
    bg: 'bg-[#EAF0FB]',
    darkBg: 'dark:bg-[#1A243D]',
    tagBg: 'bg-[#EAF0FB]',
    darkTagBg: 'dark:bg-[#1A243D]',
    tagText: 'text-[#4A7FD4]',
    darkTagText: 'dark:text-[#7AAAF0]',
    moodText: 'text-[#4A7FD4]',
    darkMoodText: 'dark:text-[#7AAAF0]',
    labelKey: 'categories.cbt',
  },
  // Interpersonal — Purple (~270°): empathy, connection
  interpersonal: {
    icon: Heart,
    iconColor: 'text-[#8B6FC0]',
    darkIconColor: 'dark:text-[#A590D4]',
    bg: 'bg-[#EDE4F5]',
    darkBg: 'dark:bg-[#252030]',
    tagBg: 'bg-[#EDE4F5]',
    darkTagBg: 'dark:bg-[#252030]',
    tagText: 'text-[#8B6FC0]',
    darkTagText: 'dark:text-[#A590D4]',
    moodText: 'text-[#8B6FC0]',
    darkMoodText: 'dark:text-[#A590D4]',
    labelKey: 'categories.interpersonal',
  },
  // Mindfulness — Green (~135°): grounding, nature, presence
  mindfulness: {
    icon: Leaf,
    iconColor: 'text-[#4F9458]',
    darkIconColor: 'dark:text-[#6DB876]',
    bg: 'bg-[#E8F2E9]',
    darkBg: 'dark:bg-[#1A2E1C]',
    tagBg: 'bg-[#E8F2E9]',
    darkTagBg: 'dark:bg-[#1A2E1C]',
    tagText: 'text-[#4F9458]',
    darkTagText: 'dark:text-[#6DB876]',
    moodText: 'text-[#4F9458]',
    darkMoodText: 'dark:text-[#6DB876]',
    labelKey: 'categories.mindfulness',
  },
  // Wellness — Amber (~40°): vitality, warmth, self-care
  wellness: {
    icon: Sun,
    iconColor: 'text-[#C4962A]',
    darkIconColor: 'dark:text-[#E5B84A]',
    bg: 'bg-[#FEF5E4]',
    darkBg: 'dark:bg-[#2E2518]',
    tagBg: 'bg-[#FEF5E4]',
    darkTagBg: 'dark:bg-[#2E2518]',
    tagText: 'text-[#C4962A]',
    darkTagText: 'dark:text-[#E5B84A]',
    moodText: 'text-[#C4962A]',
    darkMoodText: 'dark:text-[#E5B84A]',
    labelKey: 'categories.wellness',
  },
};

const DEFAULT_CATEGORY = CATEGORY_CONFIG.cbt;

function getCategoryConfig(category: SessionCategory | string | null | undefined): CategoryConfig {
  if (!category) return DEFAULT_CATEGORY;
  return CATEGORY_CONFIG[category] ?? DEFAULT_CATEGORY;
}

// ── Mood outcome config ──────────────────────────────────────────────────────

// Icon only — color comes from CATEGORY_CONFIG.moodText (per design spec 1JfsF)
const MOOD_ICON: Record<string, typeof TrendingUp> = {
  'Feeling better':     TrendingUp,
  Calmer:               TrendingUp,
  Hopeful:              TrendingUp,
  Motivated:            TrendingUp,
  Empowered:            TrendingUp,
  'Working through it': TrendingUp,
  'First steps':        TrendingUp,
  Improved:             TrendingUp,
  Grateful:             Heart,
  'Opened up':          Heart,
  Reflected:            Check,
  Relaxed:              Check,
  'Sitting with it':    Leaf,
  Exploring:            Sparkles,
  Processing:           MessageCircle,
};

// ── Filter type ──────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'completed';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDateLabel(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  const isRu = locale === 'ru';
  if (isToday(d)) return isRu ? 'Сегодня' : 'Today';
  if (isYesterday(d)) return isRu ? 'Вчера' : 'Yesterday';
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff < 7) return isRu ? `${diff} дн. назад` : `${diff} days ago`;
  return format(d, 'd MMM', { locale: isRu ? ru : enUS });
}

function getDuration(createdAt: string, endedAt: string | null, locale: string): string | null {
  if (!endedAt) return null;
  const mins = Math.round((new Date(endedAt).getTime() - new Date(createdAt).getTime()) / 60000);
  const isRu = locale === 'ru';
  if (mins < 60) return isRu ? `${mins} мин` : `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return isRu ? `${h} ч` : `${h} h`;
  return isRu ? `${h} ч ${m} мин` : `${h} h ${m} min`;
}

function isThisWeek(dateStr: string): boolean {
  return new Date(dateStr) >= subDays(new Date(), 7);
}

// ── FAB ──────────────────────────────────────────────────────────────────────

function MobileFab() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const session = await createSession();
      router.push(`/dashboard/chat/${session.id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-5 z-40 flex h-[60px] w-[60px] items-center justify-center rounded-[30px] shadow-lg transition-transform active:scale-90 disabled:opacity-50"
      style={{
        background: 'linear-gradient(180deg, #D4A08C 0%, #C4856F 100%)',
        boxShadow: '0 6px 20px rgba(196,133,111,0.25), 0 2px 6px rgba(0,0,0,0.08)',
      }}
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      ) : (
        <Plus className="h-[26px] w-[26px] text-white" />
      )}
    </button>
  );
}

// ── Active Session Card ──────────────────────────────────────────────────────

const ActiveSessionCard = memo(function ActiveSessionCard({ session }: { session: SessionDto }) {
  const t = useTranslations('sessions');
  const locale = useLocale();
  const title = session.title ?? t('defaultTitle');
  const timeAgo = formatDistanceToNow(new Date(session.createdAt), {
    addSuffix: true,
    locale: locale === 'ru' ? ru : enUS,
  });

  return (
    <Link href={`/dashboard/chat/${session.id}`}>
      <div className="active-session-card rounded-[20px] border-[1.5px] border-[#7A9E7E] p-[18px]">
        <div className="flex flex-col gap-3.5">
          {/* Top row */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[22px] bg-[#C2E5C4] dark:bg-[#2A3E2C]">
              <MessageCircle className="h-[22px] w-[22px] text-[#4F9458]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#2B2320] dark:text-[#E8E0D8]">
                {title}
              </p>
              <p className="text-xs text-[#9A8880] dark:text-[#A09A93]">
                {t('started')} {timeAgo}
              </p>
            </div>
            <div className="flex items-center gap-[5px] rounded-[20px] bg-[#C2E5C4] px-2.5 py-1 dark:bg-[#2A3E2C]">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3D9B4A]" />
              <span className="text-[11px] font-semibold text-[#3D9B4A]">{t('live')}</span>
            </div>
          </div>
          {/* Continue button */}
          <div className="flex h-[42px] items-center justify-center rounded-xl bg-[#5E9E66] transition-opacity hover:opacity-90">
            <span className="text-sm font-semibold text-white">{t('continueSession')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

// ── Completed / Analyzing Session Card ───────────────────────────────────────

const SessionCard = memo(function SessionCard({ session, compact = false }: { session: SessionDto; compact?: boolean }) {
  const t = useTranslations('sessions');
  const locale = useLocale();
  const router = useRouter();
  const title = session.title ?? t('defaultTitle');
  const cat = getCategoryConfig(session.category);
  const Icon = cat.icon;
  const dateLabel = getDateLabel(session.createdAt, locale);
  const duration = getDuration(session.createdAt, session.endedAt, locale);
  const isAnalyzing = session.status === 'analyzing' || session.status === 'ended';
  const moodOutcome = session.analysis?.moodOutcome;
  const MoodIcon = moodOutcome ? MOOD_ICON[moodOutcome] : null;
  const shortSummary = session.analysis?.shortSummary;
  const href = isAnalyzing ? `/dashboard/chat/${session.id}` : `/dashboard/chat/${session.id}/analysis?direct=true`;

  // ── Compact layout (Earlier section) ────────────────────────────────────────
  if (compact) {
    return (
      <Link href={href}>
        <div className="rounded-[20px] bg-white p-4 shadow-soft dark:bg-[#221E1B]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]',
                cat.bg,
                cat.darkBg,
              )}
            >
              <Icon className={cn('h-[22px] w-[22px]', cat.iconColor, cat.darkIconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              {/* Title + category tag (or analyzing badge) */}
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-[#2B2320] dark:text-[#E8E0D8]">
                  {title}
                </p>
                {isAnalyzing ? (
                  <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#F0E4DE] bg-warm px-2 py-[3px] dark:border-[#3A332E] dark:bg-[#2A211B]">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-[11px] font-medium text-primary">{t('analyzing')}</span>
                  </div>
                ) : (
                  <div className={cn('inline-flex h-[22px] shrink-0 items-center rounded-lg px-2 leading-none', cat.tagBg, cat.darkTagBg)}>
                    <span className={cn('text-[11px] font-medium', cat.tagText, cat.darkTagText)}>
                      {(t as (k: string) => string)(cat.labelKey)}
                    </span>
                  </div>
                )}
              </div>
              {/* Mood pill + View analysis */}
              {!isAnalyzing && (
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {MoodIcon && moodOutcome ? (
                      <div
                        className={cn(
                          'inline-flex h-[22px] max-w-full items-center gap-1 rounded-lg px-2',
                          cat.tagBg,
                          'dark:bg-[#2E2824]',
                        )}
                      >
                        <MoodIcon className={cn('h-3 w-3 shrink-0', cat.moodText, cat.darkMoodText)} />
                        <span className={cn('truncate text-[11px] font-medium', cat.moodText, cat.darkMoodText)}>
                          {(t as (k: string) => string)(`moodOutcomes.${moodOutcome}`)}
                        </span>
                      </div>
                    ) : (
                      <span className="truncate text-xs text-[#9A8880] dark:text-[#A09A93]">
                        {dateLabel}{duration ? ` · ${duration}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-primary">
                      {t('viewAnalysis')} →
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/dashboard/chat/${session.id}`); }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F0E4DE] text-[#9A8880] dark:bg-[#3D2E28] dark:text-[#C4856F]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
              {isAnalyzing && (
                <div className="mt-1.5">
                  <Skeleton className="h-2 w-[70%] rounded-[4px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── Full layout (This Week section) ─────────────────────────────────────────
  return (
    <Link href={href}>
      <div className="rounded-[20px] bg-white p-[18px] shadow-soft dark:bg-[#221E1B]">
        <div className="flex flex-col gap-3.5">
          {/* Top row: icon + title/sub + analyzing badge (if analyzing) */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]',
                cat.bg,
                cat.darkBg,
              )}
            >
              <Icon className={cn('h-[22px] w-[22px]', cat.iconColor, cat.darkIconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#2B2320] dark:text-[#E8E0D8]">
                {title}
              </p>
              <p className="text-xs text-[#9A8880] dark:text-[#A09A93]">
                {dateLabel} · {duration}
              </p>
            </div>
            {isAnalyzing && (
              <div className="flex items-center gap-1 rounded-lg border border-[#F0E4DE] bg-warm px-2 py-[3px] dark:border-[#3A332E] dark:bg-[#2A211B]">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[11px] font-medium text-primary">{t('analyzing')}</span>
              </div>
            )}
          </div>

          {/* Short summary */}
          {!isAnalyzing && shortSummary && (
            <p className="line-clamp-2 text-[12px] leading-[1.45] text-[#9A8880] dark:text-[#A09A93]">
              {shortSummary}
            </p>
          )}

          {/* Tags row: category tag + mood outcome pill */}
          {!isAnalyzing && (
            <div className="flex items-center gap-2">
              <div className={cn('inline-flex h-6 items-center rounded-xl px-2.5 leading-none', cat.tagBg, cat.darkTagBg)}>
                <span className={cn('text-[11px] font-medium', cat.tagText, cat.darkTagText)}>
                  {(t as (k: string) => string)(cat.labelKey)}
                </span>
              </div>
              {MoodIcon && moodOutcome && (
                <div
                  className={cn(
                    'flex h-6 items-center gap-1 rounded-xl px-2.5',
                    cat.tagBg,
                    'dark:bg-[#2E2824]',
                  )}
                >
                  <MoodIcon className={cn('h-3 w-3', cat.moodText, cat.darkMoodText)} />
                  <span className={cn('text-[11px] font-medium', cat.moodText, cat.darkMoodText)}>
                    {(t as (k: string) => string)(`moodOutcomes.${moodOutcome}`)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Analyzing shimmer */}
          {isAnalyzing && (
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-2.5 w-[85%] rounded-[5px]" />
              <Skeleton className="h-2.5 w-[65%] rounded-[5px]" />
            </div>
          )}

          {/* View Analysis button + chat history icon */}
          {!isAnalyzing && (
            <div className="flex items-center gap-2">
              <div className="send-button-gradient flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] text-sm font-bold text-white shadow-[0_4px_12px_#C4856F30]">
                <Sparkles className="h-4 w-4" />
                {t('viewAnalysis')}
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/dashboard/chat/${session.id}`); }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#F0E4DE] text-[#9A8880] transition-colors hover:bg-[#E8D4C8] dark:bg-[#3D2E28] dark:text-[#C4856F]"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }) {
  const t = useTranslations('sessions');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const session = await createSession();
      router.push(`/dashboard/chat/${session.id}`);
    } catch {
      setLoading(false);
    }
  };

  const message =
    filter === 'active'
      ? t('noActiveSessions')
      : filter === 'completed'
        ? t('noCompletedSessions')
        : t('noSessionsYet');

  const subtitle =
    filter === 'all'
      ? t('noSessionsDesc')
      : filter === 'active'
        ? t('noActiveDesc')
        : t('noCompletedDesc');

  return (
    <div className="flex flex-col gap-3.5 rounded-[20px] bg-card p-8 shadow-soft">
      <div className="flex justify-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF0FB] dark:bg-[#1A243D]">
          <Brain className="h-[22px] w-[22px] text-[#4A7FD4] dark:text-[#7AAAF0]" />
        </div>
      </div>
      <p className="text-center text-[15px] font-bold">{message}</p>
      <p className="text-center text-[13px] leading-[1.5] text-muted-foreground">{subtitle}</p>
      <Button
        variant="cta"
        size="cta"
        onClick={handleStart}
        disabled={loading}
        className="w-full gap-2"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {t('startSession')}
      </Button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function ChatSessionsPage() {
  const t = useTranslations('sessions');
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [fabLoading, setFabLoading] = useState(false);

  // Map filter to API status param
  const statusParam = filter === 'active' ? 'active' : filter === 'completed' ? 'completed' : undefined;
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteSessions(statusParam);

  // Flatten pages into a single sessions array
  const allSessions = useMemo(
    () => data?.pages.flatMap((p: PaginatedSessionsDto) => p.sessions) ?? [],
    [data?.pages],
  );

  // Intersection observer sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPageRef.current();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage]);

  const handleStartSession = useCallback(async () => {
    setFabLoading(true);
    try {
      const session = await createSession();
      router.push(`/dashboard/chat/${session.id}`);
    } catch {
      setFabLoading(false);
    }
  }, [router]);

  // Split sessions into groups
  const { activeSessions, thisWeekSessions, earlierSessions } = useMemo(() => {
    if (!allSessions.length) return { activeSessions: [], thisWeekSessions: [], earlierSessions: [] };

    const active: SessionDto[] = [];
    const thisWeek: SessionDto[] = [];
    const earlier: SessionDto[] = [];

    for (const s of allSessions) {
      if (s.status === 'active') {
        active.push(s);
      } else if (isThisWeek(s.createdAt)) {
        thisWeek.push(s);
      } else {
        earlier.push(s);
      }
    }

    return { activeSessions: active, thisWeekSessions: thisWeek, earlierSessions: earlier };
  }, [allSessions]);

  const hasAnySessions = allSessions.length > 0;
  const filters: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'active', label: t('filterActive') },
    { key: 'completed', label: t('filterCompleted') },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24 lg:pb-6">
      {/* ── Section 1: Header + CTA ── */}
      <div className="flex flex-col gap-4 px-5 pb-6 pt-3 lg:hidden">
        <h1 className="text-[26px] font-bold tracking-tight">{t('title')}</h1>

        {/* Start New Session CTA */}
        <button
          onClick={handleStartSession}
          disabled={fabLoading}
          className="send-button-gradient flex h-14 items-center gap-3 rounded-2xl px-5 shadow-[0_4px_12px_#C4856F30] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {fabLoading ? (
            <Loader2 className="h-[22px] w-[22px] animate-spin text-white" />
          ) : (
            <Plus className="h-[22px] w-[22px] text-white" />
          )}
          <span className="flex-1 text-left text-base font-bold text-white">
            {t('startNewSession')}
          </span>
          <ChevronRight className="h-5 w-5 text-white/80" />
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden px-6 pb-4 pt-2 lg:block">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <Button
            variant="cta"
            size="sm"
            onClick={handleStartSession}
            disabled={fabLoading}
            className="gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            {t('startNewSession')}
          </Button>
        </div>
      </div>

      {/* ── Section 2: Filters + Sessions ── */}
      <div className="flex flex-col gap-4 px-5 lg:px-6">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-2xl px-4 py-[7px] text-[13px] transition-colors',
                filter === key
                  ? 'bg-primary font-semibold text-primary-foreground'
                  : 'bg-[#EDE7E1] font-medium text-[#9A8880] dark:bg-[#2E2824] dark:text-[#A09A93]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-28 w-full rounded-[20px]" />
            <Skeleton className="h-20 w-full rounded-[20px]" />
            <Skeleton className="h-20 w-full rounded-[20px]" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasAnySessions && <EmptyState filter={filter} />}

        {/* Sessions list */}
        {!isLoading && hasAnySessions && (
          <div className="flex flex-col gap-4">
            {/* Active sessions */}
            {activeSessions.map((s) => (
              <ActiveSessionCard key={s.id} session={s} />
            ))}

            {/* This Week */}
            {thisWeekSessions.length > 0 && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B0A098] dark:text-[#7A6F65]">
                  {t('thisWeek')}
                </p>
                {thisWeekSessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </>
            )}

            {/* Earlier */}
            {earlierSessions.length > 0 && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B0A098] dark:text-[#7A6F65]">
                  {t('earlier')}
                </p>
                {earlierSessions.map((s) => (
                  <SessionCard key={s.id} session={s} compact />
                ))}
              </>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB (mobile only) */}
      <div className="lg:hidden">
        <MobileFab />
      </div>
    </div>
  );
}
