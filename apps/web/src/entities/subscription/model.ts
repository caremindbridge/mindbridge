'use client';

import type { UsageStatus } from '@mindbridge/types/src/subscription';
import { useQuery } from '@tanstack/react-query';

import { getPlans, getUsageStatus } from '@/shared/api/client';

export function useUsageStatus(sessionId?: string) {
  return useQuery({
    queryKey: ['usage-status', sessionId],
    queryFn: () => getUsageStatus(sessionId) as Promise<UsageStatus>,
    refetchInterval: 60000,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
    staleTime: 300000,
  });
}
