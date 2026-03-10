import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../client';

export interface Session {
  id: string;
  title: string | null;
  status: 'active' | 'completed';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  orderIndex: number;
  createdAt: string;
}

export interface SessionWithMessages extends Session {
  messages: Message[];
}

interface SessionsResponse {
  sessions: Session[];
  total: number;
  page: number;
  limit: number;
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiClient.get<SessionsResponse>('/chat/sessions').then((r) => r.sessions),
    staleTime: 30_000,
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => apiClient.get<SessionWithMessages>(`/chat/sessions/${sessionId}`),
    enabled: !!sessionId,
    staleTime: 0,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<Session>('/chat/sessions'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiClient.post(`/chat/sessions/${sessionId}/end`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
