'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { subDays } from 'date-fns';
import { BarChart3, Flame, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useMoodMetrics } from '@/entities/dashboard';
import { useMoodStats } from '@/entities/mood';
import { useUser } from '@/entities/user';
import { Button, ErrorCard, Skeleton, Tabs, TabsList, TabsTrigger } from '@/shared/ui';
import {
  AnxietyChart,
  EmotionChart,
  MoodChart,
  StatCard,
  WeeklyInsight,
} from '@/widgets/patient-dashboard';

export function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (user?.role === UserRole.THERAPIST) {
      router.push('/dashboard/therapist');
    }
  }, [user, router]);

  const from = useMemo(
    () => subDays(new Date(), period === 'week' ? 7 : 30).toISOString(),
    [period],
  );

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useMoodStats();
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useMoodMetrics(from);

  const isLoading = statsLoading || metricsLoading;
  const hasData =
    (stats?.totalEntries ?? 0) > 0 || (metrics?.analyses?.length ?? 0) > 0;

  if (statsError || metricsError) {
    return (
      <ErrorCard
        message={(statsError ?? metricsError)?.message}
        onRetry={() => { refetchStats(); refetchMetrics(); }}
      />
    );
  }

  if (!isLoading && !hasData) {
    return <EmptyDashboard />;
  }

  const username = user?.email?.split('@')[0] ?? '';
  const trendValue =
    stats?.trend === 'improving' ? 'up' : stats?.trend === 'declining' ? 'down' : 'stable';
  const trendLabel =
    stats?.trend === 'improving'
      ? 'Improving'
      : stats?.trend === 'declining'
        ? 'Declining'
        : 'Stable';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Welcome back{username ? `, ${username}` : ''}!
        </h1>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={<MessageSquare className="h-4 w-4" />}
              label="Mood Entries"
              value={stats?.totalEntries ?? 0}
            />
            <StatCard
              icon={<BarChart3 className="h-4 w-4" />}
              label="Avg Mood"
              value={stats?.average ? stats.average.toFixed(1) : '—'}
              description="out of 10"
            />
            <StatCard
              icon={<Flame className="h-4 w-4" />}
              label="Streak"
              value={`${stats?.streak ?? 0} days`}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Trend"
              value={trendLabel}
              trend={trendValue}
            />
          </>
        )}
      </div>

      {/* Mood Chart */}
      <MoodChart from={from} />

      {/* Middle row */}
      <div className="grid gap-6 md:grid-cols-2">
        <EmotionChart from={from} />
        <WeeklyInsight
          insight={metrics?.latestInsight ?? null}
          topics={metrics?.topTopics ?? []}
        />
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnxietyChart analyses={metrics?.analyses ?? []} />
        {metricsLoading ? (
          <Skeleton className="h-[370px] rounded-xl" />
        ) : (
          <TopEmotionsCard topEmotions={metrics?.topEmotions ?? []} />
        )}
      </div>
    </div>
  );
}

function TopEmotionsCard({
  topEmotions,
}: {
  topEmotions: Array<{ emotion: string; count: number }>;
}) {
  if (!topEmotions.length) return null;

  const max = topEmotions[0]?.count ?? 1;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="mb-4 font-semibold">Top Emotions from Sessions</p>
      <div className="space-y-3">
        {topEmotions.map(({ emotion, count }) => (
          <div key={emotion} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{emotion}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-5xl">🌱</div>
      <h2 className="mb-2 text-2xl font-bold">Your journey starts here</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        Start your first CBT session with Mira to begin tracking your mental health journey.
      </p>
      <Button asChild>
        <Link href="/dashboard/chat">Start a Session</Link>
      </Button>
    </div>
  );
}
