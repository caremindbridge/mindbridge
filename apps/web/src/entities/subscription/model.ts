'use client';

import type { UsageStatus } from '@mindbridge/types/src/subscription';
import { useQuery } from '@tanstack/react-query';

import { getPlans, getTherapistFeatures, getUsageStatus } from '@/shared/api/client';

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

export function useTherapistFeatures() {
  return useQuery({
    queryKey: ['therapist-features'],
    queryFn: getTherapistFeatures,
    staleTime: 60000,
  });
}
