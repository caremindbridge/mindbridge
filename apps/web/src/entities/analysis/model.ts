'use client';

import type { SessionAnalysisDto } from '@mindbridge/types/src/chat';
import { useQuery } from '@tanstack/react-query';

import { getAnalysis } from '@/shared/api/client';

export function useAnalysis(sessionId: string) {
  const query = useQuery<SessionAnalysisDto>({
    queryKey: ['analysis', sessionId],
    queryFn: () => getAnalysis(sessionId),
    staleTime: 5 * 60 * 1000,
  });

  return {
    analysis: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    mutate: query.refetch,
  };
}
