'use client';

import type { MessageRole } from '@mindbridge/types/src/chat';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, BarChart3, Plus } from 'lucide-react';
// import { AlertCircle, AlertTriangle } from 'lucide-react'; // TODO: Re-enable with payment banners
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/entities/session';
// import { useUsageStatus } from '@/entities/subscription'; // TODO: Re-enable when monetization is ready
import { EndSessionButton, SendMessageForm, useChatStream } from '@/features/chat';
import { MoodCheckIn } from '@/features/mood';
// import { MonthlyLimitModal, SessionLimitModal, TrialEndedModal } from '@/features/subscription'; // TODO: Re-enable when monetization is ready
import { ApiError, createSession, endSession, sendMessage } from '@/shared/api/client';
import { analytics } from '@/shared/lib/analytics';
import { cn } from '@/shared/lib/utils';
import { Button, Skeleton } from '@/shared/ui';
import { ChatWindow } from '@/widgets/chat-window';

interface ChatPageProps {
  sessionId: string;
}

export function ChatPage({ sessionId }: ChatPageProps) {
  const { data: session, isLoading } = useSession(sessionId);
  const router = useRouter();
  const queryClient = useQueryClient();
  // const t = useTranslations('subscription'); // TODO: Re-enable when monetization is ready
  const tc = useTranslations('chat');
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  // TODO: Re-enable when monetization is ready
  // const [showSessionLimitModal, setShowSessionLimitModal] = useState(false);
  // const [showMonthlyLimitModal, setShowMonthlyLimitModal] = useState(false);
  // const [showTrialEndedModal, setShowTrialEndedModal] = useState(false);

  const isActive = session?.status === 'active';

  const { messages, isStreaming, analysisReady, addUserMessage } = useChatStream({
    sessionId,
    initialMessages: session?.messages || [],
    enabled: isActive,
  });

  // TODO: Re-enable when monetization is ready
  // const { data: usage } = useUsageStatus(isActive ? sessionId : undefined);

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
        analytics.messageSent(sessionId, messages.length + 1);
        await queryClient.invalidateQueries({ queryKey: ['usage-status'] });
      } catch (error) {
        // TODO: Re-enable limit-specific error handling when monetization is ready
        if (error instanceof ApiError) {
          const data = error.data as { message?: string };
          toast.error(data.message || 'Failed to send message');
        }
        /*
        if (error instanceof ApiError && error.status === 403) {
          const data = error.data as { code: string; message: string };
          switch (data.code) {
            case 'session_limit':
              analytics.limitReached('session');
              endSession(sessionId)
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
                  queryClient.invalidateQueries({ queryKey: ['sessions'] });
                  queryClient.invalidateQueries({ queryKey: ['mood-metrics'] });
                  queryClient.invalidateQueries({ queryKey: ['mood-stats'] });
                  setShowMoodCheckIn(true);
                })
                .catch(() => setShowSessionLimitModal(true));
              break;
            case 'monthly_limit':
              analytics.limitReached('monthly');
              setShowMonthlyLimitModal(true);
              break;
            case 'trial_expired':
              analytics.limitReached('trial_expired');
              setShowTrialEndedModal(true);
              break;
            case 'no_subscription':
              router.push('/pricing');
              break;
            case 'subscription_expired':
              router.push('/pricing');
              break;
            case 'payment_failed':
              router.push('/dashboard/settings');
              toast.error(t('paymentFailed'));
              break;
            default:
              toast.error(data.message);
          }
        }
        */
      }
    },
    [sessionId, messages.length, addUserMessage, queryClient, router],
  );

  const handleEnd = useCallback(async () => {
    await endSession(sessionId);
    const userMessages = messages.filter((m) => m.role === 'user').length;
    const startTime = session ? new Date(session.createdAt).getTime() : Date.now();
    const durationMinutes = Math.round((Date.now() - startTime) / 60000);
    analytics.sessionCompleted(sessionId, userMessages, durationMinutes);
    queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['mood-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['mood-stats'] });
    setShowMoodCheckIn(true);
  }, [sessionId, messages, session, queryClient]);

  const [startingSession, setStartingSession] = useState(false);
  const handleNewSession = useCallback(async () => {
    setStartingSession(true);
    try {
      const s = await createSession();
      analytics.sessionStarted(s.id);
      router.push(`/dashboard/chat/${s.id}`);
    } catch {
      setStartingSession(false);
    }
  }, [router]);

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
        <p className="text-muted-foreground">{tc('sessionNotFound')}</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/chat">{tc('backToSessions')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Mobile header */}
      <div className="lg:hidden flex shrink-0 items-center h-12 px-2 border-b bg-background/95 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold">Mira</span>
        <div className="flex h-9 w-9 items-center justify-center">
          {isActive && <EndSessionButton onEnd={handleEnd} disabled={isStreaming} compact />}
          {!isActive && (session.status === 'completed' || analysisReady) && (
            <Link href={`/dashboard/chat/${sessionId}/analysis`} className="text-primary">
              <BarChart3 className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/dashboard/chat">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm font-semibold leading-none">{tc('cbtSession')}</p>
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
                {tc('viewAnalysis')}
              </Link>
            </Button>
          )}
        </div>
      </div>
      {/* End desktop header */}

      {/* TODO: Re-enable banners when monetization is ready */}
      {/* Payment warning banner */}
      {/* {isActive && usage?.paymentWarning && (
        <div className="flex shrink-0 items-center gap-2 border-b bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{t('paymentFailed')}</span>
          <Link href="/dashboard/settings" className="font-medium underline">
            {t('updateCard')}
          </Link>
        </div>
      )} */}
      {/* Grace period banner */}
      {/* {isActive && usage?.grace && (
        <div className="flex shrink-0 items-center gap-2 border-b bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t('graceMessage', { remaining: usage.graceRemaining ?? 0 })}
        </div>
      )} */}

      {/* Session ended banner */}
      {!isActive && (
        <div className="flex shrink-0 items-center justify-between border-b bg-muted/40 px-4 py-2.5">
          <p className="text-sm text-muted-foreground">{tc('sessionEnded')}</p>
          <Button size="sm" onClick={handleNewSession} disabled={startingSession}>
            <Plus className="mr-1.5 h-3 w-3" />
            {startingSession ? tc('creating') : tc('newSession')}
          </Button>
        </div>
      )}

      {/* Messages */}
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
      />

      {/* Session limit hint — TODO: Re-enable when monetization is ready */}
      {/* {isActive && usage?.session && (() => {
        const remaining = usage.session.limit - usage.session.used;
        return remaining > 0 && remaining <= 5;
      })() && (
        <div className="shrink-0 px-4 py-1.5 text-center text-xs text-muted-foreground/70">
          {t('sessionMessagesLeft', { count: usage.session.limit - usage.session.used })}
        </div>
      )} */}

      {/* Input */}
      {isActive && <SendMessageForm onSend={handleSend} disabled={isStreaming} />}

      <MoodCheckIn
        sessionId={sessionId}
        open={showMoodCheckIn}
        onComplete={() => { setShowMoodCheckIn(false); router.push('/dashboard'); }}
        onSkip={() => { setShowMoodCheckIn(false); router.push('/dashboard'); }}
      />

      {/* TODO: Re-enable modals when monetization is ready */}
      {/* <SessionLimitModal
        open={showSessionLimitModal}
        onClose={() => setShowSessionLimitModal(false)}
        sessionLimit={usage?.session?.limit ?? 0}
      />
      <MonthlyLimitModal
        open={showMonthlyLimitModal}
        onClose={() => setShowMonthlyLimitModal(false)}
        usage={usage}
      />
      <TrialEndedModal
        open={showTrialEndedModal}
        onClose={() => setShowTrialEndedModal(false)}
        usage={usage}
      /> */}
    </div>
  );
}
