'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { format, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import { BarChart3, Brain, Flame, Heart, Loader2, MessageCircle, Wind } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

import { useMoodMetrics } from '@/entities/dashboard';
import { useCreateMood, useMoods, useMoodStats } from '@/entities/mood';
import { useSessions } from '@/entities/session';
import { useUser } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

const QUICK_MOODS = [
  { emoji: '😰', value: 2 },
  { emoji: '😔', value: 4 },
  { emoji: '😐', value: 6 },
  { emoji: '🙂', value: 8 },
  { emoji: '😊', value: 10 },
] as const;

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

export function DashboardPage() {
  const t = useTranslations('dashboard');
  const { user } = useUser();
  const router = useRouter();
  const [moodLogged, setMoodLogged] = useState(false);

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

  // derived before remaining queries so we can control their refetch interval
  const hasAnalyzing =
    sessionsData?.sessions.some((s) => s.status === 'ended' || s.status === 'analyzing') ?? false;
  const lastCompletedSession =
    sessionsData?.sessions.find((s) => s.status === 'completed') ?? null;

  const { data: metrics, isLoading: metricsLoading } = useMoodMetrics(
    from7d,
    undefined,
    hasAnalyzing ? 4000 : false,
  );

  const insight = useMemo(() => {
    const raw = metrics?.latestInsight;
    return isValidInsight(raw) ? raw : null;
  }, [metrics]);

  const sparkData = useMemo(
    () => (moods ? [...moods].reverse().map((m) => ({ v: m.value })) : []),
    [moods],
  );

  const firstName = user?.name?.split(' ')[0] ?? null;

  const trendLabel =
    stats?.trend === 'improving'
      ? t('improvingTrend')
      : stats?.trend === 'declining'
        ? t('decliningTrend')
        : t('stableTrend');

  return (
    <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">

      <div className="p-4 md:p-6 space-y-4 md:space-y-5 pb-6">
      {/* ── Greeting ── */}
      <h1 className="text-xl md:text-2xl font-bold tracking-tight">
        {firstName ? t('greetingWithName', { name: firstName }) : t('greetingDefault')}
      </h1>

      {/* ── Quick Mood Check-in ── */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t('howAreYou')}</p>
              {moodLogged && (
                <p className="mt-0.5 text-xs text-emerald-600">{t('checkedInToday')}</p>
              )}
            </div>
            <div className="flex gap-3">
              {QUICK_MOODS.map(({ emoji, value }) => (
                <button
                  key={value}
                  type="button"
                  disabled={logging}
                  onClick={() => logMood({ value }, { onSuccess: () => setMoodLogged(true) })}
                  className="text-2xl transition-transform hover:scale-125 active:scale-95 disabled:opacity-50"
                  title={`${value}/10`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Link
              href="/dashboard/chat"
              className="text-sm text-primary underline-offset-4 hover:underline whitespace-nowrap"
            >
              {t('tellMiraMore')}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── Progress Stats ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label={t('avgMood')}
              value={stats?.average ? stats.average.toFixed(1) : '—'}
              sub={t('avgMoodDesc')}
            />
            <StatCard
              label={t('sessions')}
              value={sessionsData?.total ?? (sessionsLoading ? '…' : '0')}
            />
            <StatCard
              label={t('streak')}
              value={t('streakDays', { count: stats?.streak ?? 0 })}
              icon={<Flame className="h-3.5 w-3.5 text-amber-500" />}
            />
            <StatCard
              label={t('trend')}
              value={trendLabel}
              trend={stats?.trend}
              extra={
                sparkData.length > 1 ? (
                  <div className="mt-2 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : null
              }
            />
          </>
        )}
      </div>

      {/* ── Mira's Insight ── */}
      <Card className={cn(insight && 'border-blush-200 bg-blush-50/30', hasAnalyzing && !insight && 'border-blush-200 bg-blush-50/20')}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="h-4 w-4 text-primary" />
            {t('miraInsight')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : insight ? (
            <div>
              <p className="text-sm leading-relaxed text-foreground/80">{insight}</p>
              {lastCompletedSession && (
                <div className="mt-3 flex justify-end">
                  <Button asChild size="sm" variant="soft">
                    <Link href={`/dashboard/chat/${lastCompletedSession.id}/analysis`}>
                      {t('viewLastAnalysis')}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : hasAnalyzing ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('analyzingInsight')}</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{t('defaultInsight')}</p>
              <Button asChild size="sm" variant="soft">
                <Link href="/dashboard/chat">{t('startFirstSession')}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('quickActions')}
        </p>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <ActionCard
            href="/dashboard/chat"
            icon={<MessageCircle className="h-5 w-5" />}
            label={t('talkToMira')}
            primary
          />
          <ActionCard
            href="/dashboard/analytics"
            icon={<BarChart3 className="h-5 w-5" />}
            label={t('detailedAnalytics')}
          />
          <ActionCard
            icon={<Heart className="h-5 w-5" />}
            label={t('thoughtJournal')}
            comingSoon={t('comingSoon')}
          />
          <ActionCard
            icon={<Wind className="h-5 w-5" />}
            label={t('breathingExercise')}
            comingSoon={t('comingSoon')}
          />
        </div>
      </div>

      {/* ── Recent Sessions ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('recentSessions')}
          </p>
          <Link
            href="/dashboard/chat"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {t('allSessions')}
          </Link>
        </div>
        {hasAnalyzing && (
          <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-blush-200 bg-blush-50/40 px-4 py-2.5">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
            <p className="text-sm text-foreground/70">{t('analyzingBanner')}</p>
          </div>
        )}
        <RecentSessionsList
          sessions={sessionsData?.sessions ?? []}
          isLoading={sessionsLoading}
        />
      </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  extra,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p
          className={cn(
            'text-xl font-bold',
            trend === 'improving' && 'text-emerald-600',
            trend === 'declining' && 'text-rose-500',
          )}
        >
          {value}
        </p>
      </div>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {extra}
    </div>
  );
}

function ActionCard({
  href,
  icon,
  label,
  primary,
  comingSoon,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  comingSoon?: string;
}) {
  const inner = (
    <div
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-xl border p-4 transition-colors',
        primary
          ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
          : comingSoon
            ? 'cursor-default border-border/50 bg-muted/30'
            : 'border-border bg-card hover:bg-muted/30',
      )}
    >
      <div className={cn('text-muted-foreground', primary && 'text-primary')}>{icon}</div>
      <p className={cn('text-sm font-medium', comingSoon && 'text-muted-foreground')}>{label}</p>
      {comingSoon && (
        <span className="absolute right-2 top-2 rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
          {comingSoon}
        </span>
      )}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function RecentSessionsList({
  sessions,
  isLoading,
}: {
  sessions: Array<{ id: string; status: string; title?: string | null; createdAt: string }>;
  isLoading: boolean;
}) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('chat');
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t('noSessionsYet')}</p>
          <Button asChild size="sm">
            <Link href="/dashboard/chat">{t('startFirstSession')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const d = new Date(s.createdAt);
        const dateLabel = isToday(d) ? t('today') : isYesterday(d) ? t('yesterday') : format(d, 'MMM d');
        const title = s.title ?? tc('cbtSession');
        const isCompleted = s.status === 'completed';
        const isAnalyzing = s.status === 'analyzing' || s.status === 'ended';
        return (
          <Link
            key={s.id}
            href={`/dashboard/chat/${s.id}`}
            className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5 transition-colors hover:bg-muted/30"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isAnalyzing ? (
                <span className="flex items-center gap-1.5 rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-medium text-blush-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {tc('statusAnalyzing')}
                </span>
              ) : (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    s.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {s.status === 'active' ? tc('statusActive') : tc('statusCompleted')}
                </span>
              )}
              {isCompleted && (
                <span
                  role="link"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/dashboard/chat/${s.id}/analysis`;
                  }}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {tc('viewAnalysis')}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
