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
  });
}

export function useMoodStats() {
  return useQuery({
    queryKey: ['mood-stats'],
    queryFn: getMoodStats,
  });
}

export function useEmotionDistribution(from?: string, to?: string) {
  return useQuery({
    queryKey: ['mood-emotions', from, to],
    queryFn: () => getMoodEmotions(from, to),
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
