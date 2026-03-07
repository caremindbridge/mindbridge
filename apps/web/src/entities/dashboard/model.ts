'use client';

import { useQuery } from '@tanstack/react-query';

import { getMoodMetrics } from '@/shared/api/client';

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
}

export function useMoodMetrics(from?: string, to?: string, refetchInterval?: number | false) {
  return useQuery<DashboardMetrics>({
    queryKey: ['mood-metrics', from, to],
    queryFn: async () => {
      const data = await getMoodMetrics(from, to);
      return data as DashboardMetrics;
    },
    refetchInterval,
  });
}
