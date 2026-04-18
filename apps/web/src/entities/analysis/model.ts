'use client';

import type { SessionAnalysisDto } from '@mindbridge/types/src/chat';
import { useQuery } from '@tanstack/react-query';

import { getAnalysis } from '@/shared/api/client';

export function useAnalysis(sessionId: string) {
  const query = useQuery<SessionAnalysisDto | null>({
    queryKey: ['analysis', sessionId],
    queryFn: async (): Promise<SessionAnalysisDto | null> => {
      try {
        return await getAnalysis(sessionId);
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: (q) => (q.state.data ? false : 3000),
  });

  return {
    analysis: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    mutate: query.refetch,
  };
}
