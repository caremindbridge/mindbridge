'use client';

import type { PaginatedSessionsDto, SessionWithMessagesDto } from '@mindbridge/types/src/chat';
import { useCallback, useEffect, useState } from 'react';

import { getSession, getSessions } from '@/shared/api/client';

interface UseSessionsReturn {
  data: PaginatedSessionsDto | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

export function useSessions(page = 1, limit = 20): UseSessionsReturn {
  const [data, setData] = useState<PaginatedSessionsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getSessions(page, limit);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { data, isLoading, error, mutate: fetchSessions };
}

interface UseSessionReturn {
  session: SessionWithMessagesDto | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

export function useSession(sessionId: string): UseSessionReturn {
  const [session, setSession] = useState<SessionWithMessagesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getSession(sessionId);
      setSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, isLoading, error, mutate: fetchSession };
}
