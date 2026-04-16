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

// Capped at 8 chars/frame so bursts never produce visible jumps.
// At 60fps: 8 chars/frame = 480 chars/sec, enough to keep up with Claude.
function charsPerTick(pendingLength: number): number {
  return Math.min(8, Math.max(2, Math.ceil(pendingLength / 20)));
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
  // requestAnimationFrame handle for the drain loop
  const drainRef = useRef<number | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const stopDrain = useCallback(() => {
    if (drainRef.current !== null) {
      cancelAnimationFrame(drainRef.current);
      drainRef.current = null;
    }
    pendingRef.current = '';
    streamingKeyRef.current = null;
    finalIdRef.current = null;
  }, []);

  const startDrain = useCallback(() => {
    if (drainRef.current !== null) return;

    // Use rAF instead of setInterval: fires once per rendered frame, synchronized
    // with the display. Unlike setInterval, rAF never "catches up" missed ticks —
    // so a slow React render can't cause back-to-back drain calls that produce jumps.
    const tick = () => {
      const pending = pendingRef.current;
      const finalId = finalIdRef.current;

      if (!pending.length) {
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
          return;
        }
        drainRef.current = requestAnimationFrame(tick);
        return;
      }

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

      drainRef.current = requestAnimationFrame(tick);
    };

    drainRef.current = requestAnimationFrame(tick);
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
