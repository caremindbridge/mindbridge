'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { format, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import {
  BookOpen,
  Brain,
  Lightbulb,
  Loader2,
  Moon,
  Phone,
  Sparkles,
  Sun,
  Wind,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useMoodMetrics } from '@/entities/dashboard';
import { useCreateMood, useMoods, useMoodStats } from '@/entities/mood';
import { useSessions } from '@/entities/session';
import { useUser } from '@/entities/user';
import { analytics } from '@/shared/lib/analytics';
import { cn } from '@/shared/lib/utils';
import { Button, Skeleton } from '@/shared/ui';

const QUICK_MOODS = [
  { emoji: '😟', value: 2, key: 'moodBad' },
  { emoji: '😔', value: 4, key: 'moodLow' },
  { emoji: '😐', value: 6, key: 'moodOkay' },
  { emoji: '🙂', value: 8, key: 'moodGood' },
  { emoji: '😊', value: 10, key: 'moodGreat' },
] as const;

const QUICK_TOOLS = [
  { icon: BookOpen, key: 'journal', href: '/dashboard/chat', bg: 'bg-warm', color: 'text-primary' },
  { icon: Wind, key: 'breathe', href: undefined, bg: 'bg-green-light', color: 'text-green-accent' },
  { icon: Phone, key: 'sos', href: undefined, bg: 'bg-sos-bg', color: 'text-destructive' },
  { icon: Lightbulb, key: 'reflect', href: undefined, bg: 'bg-purple-light', color: 'text-purple-accent' },
] as const;

const WEEKLY_GOAL = 5;

function isValidInsight(s: string | null | undefined): s is string {
  if (!s) return false;
  if (
    s.includes('Unable to') ||
    s.includes('Please provide') ||
    s.includes('therapy session transcript')
  )
    return false;
  return s.length >= 20;
}

/** Map any 1-10 mood value to the nearest QUICK_MOODS value (2,4,6,8,10) */
function nearestMoodEmoji(value: number): number {
  return QUICK_MOODS.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev,
  ).value;
}

function getGreetingKey(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'goodMorning';
  if (hour < 18) return 'goodAfternoon';
  return 'goodEvening';
}

export function DashboardPage() {
  const t = useTranslations('dashboard');
  const tc = useTranslations('chat');
  const tCommon = useTranslations('common');
  const { user } = useUser();
  const router = useRouter();
  const [moodLoggedLocal, setMoodLoggedLocal] = useState(false);
  const [localMoodValue, setLocalMoodValue] = useState<number | null>(null);

  // Theme state
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    setIsDark(newDark);
  };

  useEffect(() => {
    if (user?.role === UserRole.THERAPIST && (user.activeMode ?? 'therapist') === 'therapist') {
      router.push('/dashboard/therapist');
    }
  }, [user, router]);

  const from7d = useMemo(() => startOfDay(subDays(new Date(), 7)).toISOString(), []);

  const { data: stats, isLoading: statsLoading } = useMoodStats();
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions(1, 3);
  const { data: moods } = useMoods(from7d);
  const { mutate: logMood, isPending: logging } = useCreateMood();

  const hasAnalyzing =
    sessionsData?.sessions.some((s) => s.status === 'ended' || s.status === 'analyzing') ?? false;
  const lastSession = sessionsData?.sessions[0] ?? null;

  const { data: metrics, isLoading: metricsLoading } = useMoodMetrics(
    from7d,
    undefined,
    hasAnalyzing ? 4000 : false,
  );

  const insight = useMemo(() => {
    const raw = metrics?.latestInsight;
    return isValidInsight(raw) ? raw : null;
  }, [metrics]);

  const todayMoodFromApi = moods?.find((m) => isToday(new Date(m.createdAt)));
  const hasLoggedToday = moodLoggedLocal || !!todayMoodFromApi;
  const todayMoodValue =
    localMoodValue ?? (todayMoodFromApi ? nearestMoodEmoji(todayMoodFromApi.value) : null);

  const firstName = user?.name?.split(' ')[0] ?? null;
  const initials = (user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? '?').toUpperCase();

  const weekStart = format(subDays(new Date(), 6), 'MMM d');
  const weekEnd = format(new Date(), 'd');

  const sessionsThisWeek = useMemo(() => {
    if (!sessionsData?.sessions) return 0;
    const weekAgo = subDays(new Date(), 7);
    return sessionsData.sessions.filter((s) => new Date(s.createdAt) >= weekAgo).length;
  }, [sessionsData]);

  const moodChange = useMemo(() => {
    if (!stats?.average) return '—';
    const pct = Math.round(((stats.average - 5) / 5) * 100);
    return `${pct > 0 ? '+' : ''}${pct}%`;
  }, [stats]);

  return (
    <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">
      <div className="space-y-4 p-5 pb-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between lg:hidden">
          <div>
            {firstName ? (
              <>
                <p className="text-[13px] text-muted-foreground">{t(getGreetingKey())}</p>
                <h1 className="text-[26px] font-bold leading-tight tracking-tight">
                  {firstName}
                </h1>
              </>
            ) : (
              <h1 className="text-xl font-bold tracking-tight">{t(getGreetingKey())}</h1>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60"
              aria-label={tCommon('toggleTheme')}
            >
              {isDark ? (
                <Moon className="h-[18px] w-[18px] text-primary" />
              ) : (
                <Sun className="h-[18px] w-[18px] text-muted-foreground" />
              )}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-avatar-bg">
              <span className="text-sm font-bold text-blush-700">{initials}</span>
            </div>
          </div>
        </div>

        {/* Desktop-only greeting (sidebar has the nav, but we still greet) */}
        <h1 className="hidden text-2xl font-bold tracking-tight lg:block">
          {firstName ? t('greetingWithName', { name: firstName }) : t(getGreetingKey())}
        </h1>

        {/* ── Mira Hero Card ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, #B56756 0%, #C4856F 50%, #E0A88A 100%)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-[13px] font-bold text-white">{t('miraName')}</span>
            <div className="h-2 w-2 rounded-full bg-[#4ADE80]" />
          </div>
          <div className="mt-2.5">
            <h2 className="text-lg font-bold text-white">{t('miraReady')}</h2>
            <p className="mt-1 text-[13px] text-white/80">{t('miraDesc')}</p>
          </div>
          <Link
            href="/dashboard/chat"
            className="mt-3 flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#C4856F] transition-opacity hover:opacity-90 active:opacity-80"
          >
            {t('startSessionCta')}
          </Link>
        </div>

        {/* ── Mood Check-in ── */}
        <div className="rounded-xl border border-border/50 bg-card p-[18px] shadow-soft">
          <h3 className="mb-3.5 text-[15px] font-bold">{t('howAreYou')}</h3>
          <div className="flex justify-between">
            {QUICK_MOODS.map(({ emoji, value, key }) => (
              <button
                key={value}
                type="button"
                disabled={logging || hasLoggedToday}
                onClick={() =>
                  logMood(
                    { value },
                    {
                      onSuccess: () => {
                        setLocalMoodValue(value);
                        setMoodLoggedLocal(true);
                        analytics.moodCheckedIn(value, 'dashboard');
                      },
                    },
                  )
                }
                className={cn(
                  'flex flex-col items-center gap-1.5 transition-opacity',
                  hasLoggedToday && todayMoodValue !== value && 'opacity-40',
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full bg-warm transition-transform',
                    hasLoggedToday && todayMoodValue === value
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                      : !hasLoggedToday && 'hover:scale-110 active:scale-95',
                  )}
                >
                  <span className="text-[22px]">{emoji}</span>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    hasLoggedToday && todayMoodValue === value
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground',
                  )}
                >
                  {t(key)}
                </span>
              </button>
            ))}
          </div>
          {hasLoggedToday && (
            <p className="mt-3 text-center text-xs font-medium text-green-accent">
              {t('checkedInToday')}
            </p>
          )}
        </div>

        {/* ── Quick Tools ── */}
        <div className="flex gap-2.5">
          {QUICK_TOOLS.map(({ icon: Icon, key, href, bg, color }) => {
            const disabled = true;
            const inner = (
              <div
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5',
                  disabled && 'opacity-50',
                )}
              >
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full',
                    bg,
                    !disabled && 'transition-transform hover:scale-110 active:scale-95',
                  )}
                >
                  <Icon className={cn('h-[18px] w-[18px]', color)} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{t(key)}</span>
                {disabled && (
                  <span className="text-[9px] font-semibold text-muted-foreground/70">
                    {t('comingSoon')}
                  </span>
                )}
              </div>
            );
            if (href) {
              return (
                <Link key={key} href={href} className="flex-1">
                  {inner}
                </Link>
              );
            }
            return (
              <div key={key} className="flex-1 cursor-default">
                {inner}
              </div>
            );
          })}
        </div>

        {/* ── This Week Stats ── */}
        <div className="rounded-xl border border-border/50 bg-card px-4 py-[18px] shadow-soft">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">{t('thisWeek')}</h3>
            <span className="text-xs text-muted-foreground">
              {weekStart}–{weekEnd}
            </span>
          </div>

          {statsLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : (
            <>
              {/* Stats row with dividers */}
              <div className="flex items-center">
                <div className="flex flex-1 flex-col items-center gap-0.5">
                  <span className="text-[22px] font-bold">{stats?.streak ?? 0}</span>
                  <span className="text-[11px] text-green-accent">{t('daysInRow')}</span>
                </div>
                <div className="h-9 w-px bg-border" />
                <div className="flex flex-1 flex-col items-center gap-0.5">
                  <span className="text-[22px] font-bold">{sessionsThisWeek}</span>
                  <span className="text-[11px] text-muted-foreground">{t('sessionsShort')}</span>
                </div>
                <div className="h-9 w-px bg-border" />
                <div className="flex flex-1 flex-col items-center gap-0.5">
                  <span className="text-[22px] font-bold text-green-accent">
                    {moodChange}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{t('moodScore')}</span>
                </div>
              </div>

              {/* Weekly goal progress */}
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{t('weeklyGoal')}</span>
                  <span className="text-[11px] font-semibold text-primary">
                    {sessionsThisWeek} / {WEEKLY_GOAL}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blush-300 to-primary transition-all"
                    style={{ width: `${Math.min(100, (sessionsThisWeek / WEEKLY_GOAL) * 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Mira's Insight ── */}
        <div className="rounded-2xl border border-border/50 bg-warm p-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-[11px] font-semibold tracking-wide text-primary">
              {t('miraInsight')}
            </h3>
          </div>
          {metricsLoading ? (
            <div className="mt-2.5 space-y-1.5">
              <Skeleton className="h-2.5 w-4/5 rounded-full" />
              <Skeleton className="h-2.5 w-3/5 rounded-full" />
            </div>
          ) : insight ? (
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-foreground/80">
              {insight}
            </p>
          ) : hasAnalyzing ? (
            <div className="mt-2.5">
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-[85%] rounded-full" />
                <Skeleton className="h-2.5 w-[65%] rounded-full" />
                <Skeleton className="h-2.5 w-[45%] rounded-full" />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t('analyzingInsight')}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[13px] font-medium text-muted-foreground">
              {t('defaultInsight')}
            </p>
          )}
        </div>

        {/* ── Recent Session ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-bold">{t('recentSession')}</h3>
            <Link
              href="/dashboard/chat"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              {t('viewAll')}
            </Link>
          </div>

          {sessionsLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : lastSession ? (
            <RecentSessionCard session={lastSession} />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card py-8 text-center shadow-soft">
              <p className="text-sm text-muted-foreground">{t('noSessionsYet')}</p>
              <Button asChild size="sm">
                <Link href="/dashboard/chat">{t('startFirstSession')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentSessionCard({
  session,
}: {
  session: { id: string; status: string; title?: string | null; createdAt: string };
}) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('chat');

  const d = new Date(session.createdAt);
  const dateLabel = isToday(d) ? t('today') : isYesterday(d) ? t('yesterday') : format(d, 'MMM d');
  const title = session.title ?? tc('cbtSession');
  const isActive = session.status === 'active';
  const isAnalyzing = session.status === 'analyzing' || session.status === 'ended';

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
          <Brain className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        </div>
        {isAnalyzing ? (
          <span className="flex items-center gap-1.5 rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-medium text-blush-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            {tc('statusAnalyzing')}
          </span>
        ) : (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              isActive
                ? 'bg-green-light text-green-accent'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {isActive ? tc('statusActive') : 'CBT'}
          </span>
        )}
      </div>

      <Link
        href={`/dashboard/chat/${session.id}`}
        className={cn(
          'mt-3 flex h-10 items-center justify-center rounded-full text-sm font-semibold transition-opacity hover:opacity-90',
          isActive
            ? 'bg-green-accent text-white'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {isActive ? t('continueSession') : t('viewLastAnalysis')}
      </Link>
    </div>
  );
}
