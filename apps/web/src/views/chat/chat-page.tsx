'use client';

import type { MessageRole } from '@mindbridge/types/src/chat';
import { format } from 'date-fns';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { useSession } from '@/entities/session';
import { EndSessionButton, SendMessageForm, useChatStream } from '@/features/chat';
import { MoodCheckIn } from '@/features/mood';
import { endSession, sendMessage } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import { Button, Skeleton } from '@/shared/ui';
import { ChatWindow } from '@/widgets/chat-window';

interface ChatPageProps {
  sessionId: string;
}

export function ChatPage({ sessionId }: ChatPageProps) {
  const { session, isLoading, mutate } = useSession(sessionId);
  const router = useRouter();
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);

  const isActive = session?.status === 'active';

  const { messages, isStreaming, analysisReady, addUserMessage } = useChatStream({
    sessionId,
    initialMessages: session?.messages || [],
    enabled: isActive,
  });

  const handleSend = useCallback(
    async (content: string) => {
      try {
        const msg = await sendMessage(sessionId, content);
        addUserMessage({
          id: msg.id,
          role: 'user' as MessageRole,
          content: msg.content,
          sessionId,
          orderIndex: messages.length,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // error handled by API client
      }
    },
    [sessionId, messages.length, addUserMessage],
  );

  const handleEnd = useCallback(async () => {
    await endSession(sessionId);
    mutate();
    setShowMoodCheckIn(true);
  }, [sessionId, mutate]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Session not found</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/chat">Back to sessions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/dashboard/chat">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm font-semibold leading-none">CBT Session</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(new Date(session.createdAt), 'MMM d, yyyy · HH:mm')}
            </p>
          </div>
          <span
            className={cn(
              'ml-1 h-2 w-2 shrink-0 rounded-full',
              isActive ? 'bg-green-500' : 'bg-muted-foreground/30',
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          {isActive && <EndSessionButton onEnd={handleEnd} disabled={isStreaming} />}
          {(session.status === 'completed' || analysisReady) && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/chat/${sessionId}/analysis`}>
                <BarChart3 className="mr-2 h-3 w-3" />
                View Analysis
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
      />

      {/* Input */}
      {isActive && <SendMessageForm onSend={handleSend} disabled={isStreaming} />}

      <MoodCheckIn
        sessionId={sessionId}
        open={showMoodCheckIn}
        onComplete={() => { setShowMoodCheckIn(false); router.push('/dashboard'); }}
        onSkip={() => { setShowMoodCheckIn(false); router.push('/dashboard'); }}
      />
    </div>
  );
}
