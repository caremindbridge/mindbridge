'use client';

import { startOfDay, subDays } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useMoodMetrics } from '@/entities/dashboard';
import { Badge, Tabs, TabsList, TabsTrigger } from '@/shared/ui';
import { AnxietyChart, EmotionChart, MoodChart } from '@/widgets/patient-dashboard';

export function AnalyticsPage() {
  const t = useTranslations('dashboard');
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const from = useMemo(
    () => startOfDay(subDays(new Date(), period === 'week' ? 7 : 30)).toISOString(),
    [period],
  );

  const { data: metrics } = useMoodMetrics(from);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('analyticsTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('analyticsSubtitle')}</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">{t('week')}</TabsTrigger>
            <TabsTrigger value="month">{t('month')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <MoodChart from={from} />

      <div className="grid gap-6 md:grid-cols-2">
        <EmotionChart from={from} />
        <AnxietyChart analyses={metrics?.analyses ?? []} />
      </div>

      {(metrics?.topTopics?.length ?? 0) > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="mb-3 font-semibold">{t('topTopics')}</p>
          <div className="flex flex-wrap gap-2">
            {metrics!.topTopics.map(({ topic, count }) => (
              <Badge key={topic} variant="secondary">
                {topic} · {count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
