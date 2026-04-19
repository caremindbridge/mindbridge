'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createMood,
  getMoodEmotions,
  getMoods,
  getMoodStats,
} from '@/shared/api/client';

export function useMoods(from?: string, to?: string) {
  return useQuery({
    queryKey: ['moods', from, to],
    queryFn: () => getMoods(from, to),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMoodStats() {
  return useQuery({
    queryKey: ['mood-stats'],
    queryFn: getMoodStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmotionDistribution(from?: string, to?: string) {
  return useQuery({
    queryKey: ['mood-emotions', from, to],
    queryFn: () => getMoodEmotions(from, to),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMood,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moods'] });
      qc.invalidateQueries({ queryKey: ['mood-stats'] });
      qc.invalidateQueries({ queryKey: ['mood-emotions'] });
    },
  });
}
