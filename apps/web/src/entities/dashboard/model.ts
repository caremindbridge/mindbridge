'use client';

import { useQuery } from '@tanstack/react-query';

import { getMiraOverview, getMoodMetrics } from '@/shared/api/client';

export interface AnalysisMetric {
  id: string;
  sessionId: string;
  anxietyLevel: number | null;
  depressionLevel: number | null;
  keyEmotions: string[] | null;
  keyTopics: string[] | null;
  copingStrategies: string[] | null;
  riskFlags: string | null;
  moodInsight: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  analyses: AnalysisMetric[];
  averageAnxiety: number | null;
  averageDepression: number | null;
  topEmotions: Array<{ emotion: string; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  latestInsight: string | null;
  totalDays: number;
  sessionCount: number;
  avgDurationMins: number;
  sessionsPerWeek: Array<{ weekNumber: number; count: number }>;
  cognitiveDistortionsTotal: number;
  reframedCount: number;
  topDistortion: string | null;
  topTriggers: Array<{ trigger: string; count: number }>;
}

export function useMoodMetrics(from?: string, to?: string, refetchInterval?: number | false) {
  return useQuery<DashboardMetrics>({
    queryKey: ['mood-metrics', from, to],
    queryFn: async () => {
      const data = await getMoodMetrics(from, to);
      return data as DashboardMetrics;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval,
  });
}

export function useMiraOverview(period: 'week' | 'month', locale: string) {
  return useQuery<{ text: string }>({
    queryKey: ['mira-overview', period, locale],
    queryFn: () => getMiraOverview(period, locale),
    staleTime: 1000 * 60 * 30,
  });
}
