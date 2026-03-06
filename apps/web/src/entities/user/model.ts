'use client';

import type { UserDto } from '@mindbridge/types/src/user';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';

import { getMe } from '@/shared/api/client';

export function useUser() {
  const query = useQuery<UserDto | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const token = Cookies.get('token');
      if (!token) return null;
      return getMe();
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    mutate: query.refetch,
  };
}
