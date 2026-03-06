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

const TEMP_ID = '__streaming__';
// Typewriter drain: runs every DRAIN_MS, emits CHARS_PER_TICK characters.
// Adaptive: drains faster when queue is large so we never lag far behind.
const DRAIN_MS = 16; // ~60fps

function charsPerTick(pendingLength: number): number {
  // Always drain the queue in ~300ms regardless of size.
  // Floor at 2, no hard cap — large bursts drain quickly, small trickles drain smoothly.
  return Math.max(2, Math.ceil(pendingLength / 18));
}

export function useChatStream({
  sessionId,
  initialMessages = [],
  enabled = true,
}: UseChatStreamOptions): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);

  // Received-but-not-yet-displayed text queue
  const pendingRef = useRef('');
  // Stable key for the current streaming bubble (set once, reused across ticks)
  const streamingKeyRef = useRef<string | null>(null);
  // Final message id to apply once the queue is fully drained
  const finalIdRef = useRef<string | null>(null);
  // The drain interval handle
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const stopDrain = useCallback(() => {
    if (drainRef.current) {
      clearInterval(drainRef.current);
      drainRef.current = null;
    }
    pendingRef.current = '';
    streamingKeyRef.current = null;
    finalIdRef.current = null;
  }, []);

  const startDrain = useCallback(() => {
    if (drainRef.current) return;

    drainRef.current = setInterval(() => {
      const pending = pendingRef.current;
      const finalId = finalIdRef.current;

      if (!pending.length) {
        // Queue empty — if message_complete arrived, finalize now
        if (finalId !== null) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.isStreaming) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...last, id: finalId, isStreaming: false };
              return updated;
            }
            return prev;
          });
          setIsStreaming(false);
          stopDrain();
        }
        return;
      }

      // Drain a chunk
      const n = charsPerTick(pending.length);
      const chunk = pending.slice(0, n);
      pendingRef.current = pending.slice(n);

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.isStreaming) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, content: last.content + chunk };
          return updated;
        }
        // First chunk — create the streaming bubble with a stable key
        const key = streamingKeyRef.current ?? (streamingKeyRef.current = crypto.randomUUID());
        return [
          ...prev,
          {
            id: TEMP_ID,
            _key: key,
            role: 'assistant' as MessageRole,
            content: chunk,
            sessionId,
            orderIndex: prev.length,
            createdAt: new Date().toISOString(),
            isStreaming: true,
          },
        ];
      });
    }, DRAIN_MS);
  }, [sessionId, stopDrain]);

  useEffect(() => {
    if (!enabled) return;

    const token = getAuthToken();
    if (!token) return;

    const url = `${env.apiUrl}/api/chat/sessions/${sessionId}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onopen = () => setIsConnected(true);
    es.onerror = () => setIsConnected(false);

    es.onmessage = (event) => {
      try {
        const parsed: ChatStreamEvent = JSON.parse(event.data);

        switch (parsed.type) {
          case 'token':
            pendingRef.current += parsed.data ?? '';
            startDrain();
            break;

          case 'message_complete':
            // Store final id — the drain interval will apply it once queue is empty
            finalIdRef.current = parsed.messageId ?? crypto.randomUUID();
            // Edge case: queue already empty when complete fires (very short response)
            if (!pendingRef.current.length && !drainRef.current) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.isStreaming) {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...last,
                    id: finalIdRef.current!,
                    isStreaming: false,
                  };
                  return updated;
                }
                return prev;
              });
              setIsStreaming(false);
              finalIdRef.current = null;
            }
            break;

          case 'analysis_ready':
            setAnalysisReady(true);
            break;

          case 'error':
            pendingRef.current = '';
            stopDrain();
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
      stopDrain();
    };
  }, [sessionId, enabled, startDrain, stopDrain]);

  const addUserMessage = useCallback((message: MessageDto) => {
    setMessages((prev) => [...prev, message]);
    setIsStreaming(true);
  }, []);

  return { messages, isStreaming, isConnected, analysisReady, addUserMessage };
}
