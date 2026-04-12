'use client';

import type { PaginatedSessionsDto, SessionWithMessagesDto } from '@mindbridge/types/src/chat';
import { useQuery } from '@tanstack/react-query';

import { getSession, getSessions } from '@/shared/api/client';

export function useSessions(
  page = 1,
  limit = 20,
  status?: string,
  category?: string,
) {
  return useQuery<PaginatedSessionsDto>({
    queryKey: ['sessions', page, limit, status, category],
    queryFn: () => getSessions(page, limit, status, category),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (query) => {
      const sessions = (query.state.data as PaginatedSessionsDto | undefined)?.sessions;
      if (!sessions) return false;
      return sessions.some((s) => s.status === 'ended' || s.status === 'analyzing') ? 4000 : false;
    },
  });
}

export function useSession(sessionId: string) {
  return useQuery<SessionWithMessagesDto>({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    staleTime: 30000,
  });
}
