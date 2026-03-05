'use client';

import type { SessionAnalysisDto } from '@mindbridge/types/src/chat';
import { useCallback, useEffect, useState } from 'react';

import { getAnalysis } from '@/shared/api/client';

interface UseAnalysisReturn {
  analysis: SessionAnalysisDto | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

export function useAnalysis(sessionId: string): UseAnalysisReturn {
  const [analysis, setAnalysis] = useState<SessionAnalysisDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getAnalysis(sessionId);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, isLoading, error, mutate: fetchAnalysis };
}
