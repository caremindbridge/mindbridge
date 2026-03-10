import { useCallback, useEffect, useRef, useState } from 'react';

import * as SecureStore from 'expo-secure-store';
import EventSource from 'react-native-sse';

import { apiClient } from '../client';
import { siteConfig } from '../../lib/site-config';
import type { Message } from './use-sessions';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SseEvent {
  type: 'token' | 'message_complete' | 'error' | 'keepalive';
  data?: string;
  messageId?: string;
}

interface UseChatStreamReturn {
  messages: DisplayMessage[];
  streamingContent: string;
  isStreaming: boolean;
  limitError: string | null;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
}

export function useChatStream(
  sessionId: string,
  initialMessages: Message[] = [],
): UseChatStreamReturn {
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    initialMessages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })),
  );
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const accumulatedRef = useRef('');
  const isStreamingRef = useRef(false);

  // Update messages when initialMessages load
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(
        initialMessages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })),
      );
    }
  }, [initialMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Establish SSE connection
  useEffect(() => {
    let es: EventSource | null = null;

    const connect = async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;

      es = new EventSource(`${siteConfig.apiUrl}/chat/sessions/${sessionId}/stream`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Locale': siteConfig.locale,
        },
      });

      esRef.current = es;

      es.addEventListener('message', (event) => {
        if (!event.data) return;
        try {
          const parsed = JSON.parse(event.data) as SseEvent;

          if (parsed.type === 'token' && parsed.data) {
            accumulatedRef.current += parsed.data;
            setStreamingContent(accumulatedRef.current);
            if (!isStreamingRef.current) {
              isStreamingRef.current = true;
              setIsStreaming(true);
            }
          } else if (parsed.type === 'message_complete') {
            const finalContent = accumulatedRef.current;
            const msgId = parsed.messageId ?? `msg-${Date.now()}`;
            setMessages((prev) => [
              ...prev,
              { id: msgId, role: 'assistant', content: finalContent },
            ]);
            accumulatedRef.current = '';
            setStreamingContent('');
            isStreamingRef.current = false;
            setIsStreaming(false);
          } else if (parsed.type === 'error') {
            setError(parsed.data ?? 'Stream error');
            accumulatedRef.current = '';
            setStreamingContent('');
            isStreamingRef.current = false;
            setIsStreaming(false);
          }
        } catch {
          // Ignore parse errors for partial chunks
        }
      });

      es.addEventListener('error', () => {
        // Connection errors — SSE will auto-reconnect
      });
    };

    connect();

    return () => {
      es?.close();
      esRef.current = null;
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreamingRef.current) return;

      setError(null);
      setLimitError(null);
      accumulatedRef.current = '';

      // Optimistically add user message
      const userMsg: DisplayMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        await apiClient.post(`/chat/sessions/${sessionId}/messages`, { content });
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        const limitCodes = [
          'session_limit',
          'monthly_limit',
          'trial_expired',
          'no_subscription',
          'payment_failed',
          'subscription_expired',
        ];
        if (err?.code && limitCodes.includes(err.code)) {
          setLimitError(err.code);
        } else {
          setError(err?.message ?? 'Failed to send message');
        }
        // Remove optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      }
    },
    [sessionId],
  );

  return { messages, streamingContent, isStreaming, limitError, error, sendMessage };
}
