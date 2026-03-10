import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../client';

interface MoodPayload {
  value: number;
  note?: string;
  sessionId?: string;
  emotions?: string[];
}

export function useSubmitMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MoodPayload) => apiClient.post('/mood', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
