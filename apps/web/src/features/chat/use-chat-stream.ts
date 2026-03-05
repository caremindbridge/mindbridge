'use client';

import type { ChatStreamEvent, MessageDto, MessageRole } from '@mindbridge/types/src/chat';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getAuthToken } from '@/shared/api/client';
import { env } from '@/shared/config/env';

export interface ChatMessage extends MessageDto {
  isStreaming?: boolean;
  /** Stable React key — set once on creation, never updated. Prevents remount on ID change. */
  _key?: string;
}

interface UseChatStreamOptions {
  sessionId: string;
  initialMessages?: MessageDto[];
  enabled?: boolean;
}

interface UseChatStreamReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  analysisReady: boolean;
  addUserMessage: (message: MessageDto) => void;
}

const FLUSH_MS = 30;
const TEMP_ID = '__streaming__';

export function useChatStream({
  sessionId,
  initialMessages = [],
  enabled = true,
}: UseChatStreamOptions): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);

  const bufferRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Flushes buffered tokens into the last streaming message.
  // If finalId is provided, also marks the message as complete.
  const flushBuffer = useCallback(
    (finalId?: string) => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      const buffered = bufferRef.current;
      bufferRef.current = '';
      const isFinal = finalId !== undefined;

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.isStreaming) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + buffered,
            ...(isFinal ? { id: finalId || last.id, isStreaming: false } : {}),
          };
          return updated;
        }
        if (buffered) {
          // First flush — add the streaming message with a stable key
          const stableKey = crypto.randomUUID();
          return [
            ...prev,
            {
              id: isFinal ? (finalId || stableKey) : TEMP_ID,
              _key: stableKey,
              role: 'assistant' as MessageRole,
              content: buffered,
              sessionId,
              orderIndex: prev.length,
              createdAt: new Date().toISOString(),
              isStreaming: !isFinal,
            },
          ];
        }
        return prev;
      });
    },
    [sessionId],
  );

  useEffect(() => {
    if (!enabled) return;

    const token = getAuthToken();
    if (!token) return;

    const url = `${env.apiUrl}/chat/sessions/${sessionId}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onopen = () => setIsConnected(true);
    es.onerror = () => setIsConnected(false);

    es.onmessage = (event) => {
      try {
        const parsed: ChatStreamEvent = JSON.parse(event.data);

        switch (parsed.type) {
          case 'token':
            bufferRef.current += parsed.data ?? '';
            if (!flushTimerRef.current) {
              flushTimerRef.current = setTimeout(() => flushBuffer(), FLUSH_MS);
            }
            break;

          case 'message_complete':
            flushBuffer(parsed.messageId ?? crypto.randomUUID());
            setIsStreaming(false);
            break;

          case 'analysis_ready':
            setAnalysisReady(true);
            break;

          case 'error':
            if (flushTimerRef.current) {
              clearTimeout(flushTimerRef.current);
              flushTimerRef.current = null;
            }
            bufferRef.current = '';
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              return last?.isStreaming ? prev.slice(0, -1) : prev;
            });
            setIsStreaming(false);
            break;

          case 'keepalive':
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      es.close();
      setIsConnected(false);
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [sessionId, enabled, flushBuffer]);

  const addUserMessage = useCallback((message: MessageDto) => {
    setMessages((prev) => [...prev, message]);
    setIsStreaming(true); // start waiting for response
  }, []);

  return { messages, isStreaming, isConnected, analysisReady, addUserMessage };
}
