'use client';

import type { UserDto } from '@mindbridge/types/src/user';
import Cookies from 'js-cookie';
import { useState, useEffect, useCallback } from 'react';

import { getMe } from '@/shared/api/client';


interface UseUserReturn {
  user: UserDto | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    const token = Cookies.get('token');

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getMe();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, isLoading, error, mutate: fetchUser };
}
