'use client';

import { startOfDay, subDays } from 'date-fns';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useMoodMetrics } from '@/entities/dashboard';
import { Badge, Button, Tabs, TabsList, TabsTrigger } from '@/shared/ui';
import { AnxietyChart, EmotionChart, MoodChart } from '@/widgets/patient-dashboard';

export function AnalyticsPage() {
  const t = useTranslations('dashboard');
  const tp = useTranslations('pricing');
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  // TODO: Re-enable plan gating when monetization is ready
  const isLitePlan = false;

  const from = useMemo(
    () => startOfDay(subDays(new Date(), period === 'week' ? 7 : 30)).toISOString(),
    [period],
  );

  const { data: metrics } = useMoodMetrics(from);

  return (
    <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hidden lg:block text-2xl font-bold">{t('analyticsTitle')}</h1>
            <p className="hidden lg:block text-sm text-muted-foreground">{t('analyticsSubtitle')}</p>
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

          {/* AnxietyChart — locked for lite/trial */}
          <div className="relative">
            <AnxietyChart analyses={metrics?.analyses ?? []} />
            {isLitePlan && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl backdrop-blur-[6px] bg-background/60">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground/80 text-center px-4">
                  {t('analyticsLockedTitle')}
                </p>
                <Button size="sm" variant="soft" asChild className="h-7 text-xs mt-1">
                  <Link href="/pricing">{tp('upgradeTo')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* TopTopics — locked for lite/trial */}
        {(isLitePlan || (metrics?.topTopics?.length ?? 0) > 0) && (
          <div className="relative rounded-xl border bg-card p-6 shadow-sm">
            <p className="mb-3 font-semibold">{t('topTopics')}</p>
            <div className="flex flex-wrap gap-2">
              {(metrics?.topTopics ?? []).map(({ topic, count }) => (
                <Badge key={topic} variant="secondary">
                  {topic} · {count}
                </Badge>
              ))}
              {/* Placeholder badges so blurred preview looks populated */}
              {isLitePlan && (metrics?.topTopics?.length ?? 0) === 0 && (
                <>
                  {['████████', '██████', '█████████', '███████'].map((ph) => (
                    <Badge key={ph} variant="secondary" className="opacity-40">{ph}</Badge>
                  ))}
                </>
              )}
            </div>
            {isLitePlan && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl backdrop-blur-[6px] bg-background/60">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground/80 text-center px-4">
                  {t('analyticsLockedTitle')}
                </p>
                <Button size="sm" variant="soft" asChild className="h-7 text-xs mt-1">
                  <Link href="/pricing">{tp('upgradeTo')}</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
