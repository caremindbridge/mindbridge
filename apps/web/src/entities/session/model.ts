'use client';

import type { PaginatedSessionsDto, SessionWithMessagesDto } from '@mindbridge/types/src/chat';
import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getSession, getSessions } from '@/shared/api/client';

const SESSIONS_PAGE_SIZE = 15;

export function useSessions(
  page = 1,
  limit = 20,
  status?: string,
  category?: string,
) {
  return useQuery<PaginatedSessionsDto>({
    queryKey: ['sessions', page, limit, status, category],
    queryFn: () => getSessions(page, limit, status, category),
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const sessions = (query.state.data as PaginatedSessionsDto | undefined)?.sessions;
      if (!sessions) return false;
      return sessions.some((s) => s.status === 'ended' || s.status === 'analyzing') ? 4000 : false;
    },
  });
}

export function useInfiniteSessions(status?: string, category?: string) {
  return useInfiniteQuery<
    PaginatedSessionsDto,
    Error,
    InfiniteData<PaginatedSessionsDto>,
    ['sessions-infinite', string | undefined, string | undefined],
    number
  >({
    queryKey: ['sessions-infinite', status, category],
    queryFn: ({ pageParam }) => getSessions(pageParam, SESSIONS_PAGE_SIZE, status, category),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.sessions.length === SESSIONS_PAGE_SIZE ? lastPageParam + 1 : undefined,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const pages = (query.state.data as InfiniteData<PaginatedSessionsDto> | undefined)?.pages;
      if (!pages) return false;
      const hasAnalyzing = pages.some((p) =>
        p.sessions.some((s) => s.status === 'ended' || s.status === 'analyzing'),
      );
      return hasAnalyzing ? 4000 : false;
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
