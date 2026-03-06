'use client';

import type { UsageStatus } from '@mindbridge/types/src/subscription';
import { useQuery } from '@tanstack/react-query';

import { getPlans, getUsageStatus } from '@/shared/api/client';

export function useUsageStatus(sessionId?: string, planType?: 'patient' | 'therapist') {
  return useQuery({
    queryKey: ['usage-status', sessionId, planType],
    queryFn: () => getUsageStatus(sessionId, planType) as Promise<UsageStatus>,
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
