'use client';

import type { MessageRole } from '@mindbridge/types/src/chat';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { BarChart3, ChevronLeft, MoreVertical, Plus } from 'lucide-react';
// import { AlertCircle, AlertTriangle } from 'lucide-react'; // TODO: Re-enable with payment banners
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/entities/session';
// import { useUsageStatus } from '@/entities/subscription'; // TODO: Re-enable when monetization is ready
import { EndSessionButton, SendMessageForm, useChatStream } from '@/features/chat';
import { MoodCheckIn } from '@/features/mood';
// import { MonthlyLimitModal, SessionLimitModal, TrialEndedModal } from '@/features/subscription'; // TODO: Re-enable when monetization is ready
import { ApiError, createSession, endSession, sendMessage } from '@/shared/api/client';
import { analytics } from '@/shared/lib/analytics';
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
      <div className="flex shrink-0 flex-col lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          {/* Left: back + info */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-[#2B2320] dark:text-[#E8E0D8]">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex flex-col gap-px">
              <span className="text-sm font-bold text-[#2B2320] dark:text-[#E8E0D8]">{tc('mira')}</span>
              {isActive && (
                <span className="text-[11px] text-[#7A9E7E]">{tc('sessionInProgress')}</span>
              )}
              {!isActive && (
                <span className="text-[11px] text-[#9A8880] dark:text-[#A09A93]">{tc('sessionEnded')}</span>
              )}
            </div>
          </div>
          {/* Right: timer + menu */}
          <div className="flex items-center gap-3">
            {!isActive && (session.status === 'completed' || analysisReady) && (
              <Link
                href={`/dashboard/chat/${sessionId}/analysis`}
                className="flex items-center gap-1.5 rounded-xl bg-[#FFF8F0] px-3 py-1.5 dark:bg-[#2A211B]"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#C4856F] dark:text-[#D4A89A]" />
                <span className="text-[13px] font-semibold text-[#C4856F] dark:text-[#D4A89A]">{tc('viewAnalysis')}</span>
              </Link>
            )}
            <MoreVertical className="h-5 w-5 text-[#9A8880] dark:text-[#A09A93]" />
          </div>
        </div>
        {/* Divider */}
        <div className="h-px bg-[#F0E4DE] dark:bg-[#3A332E]" />
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex shrink-0 flex-col">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/chat" className="text-[#2B2320] dark:text-[#E8E0D8]">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div className="flex flex-col gap-px">
              <span className="text-sm font-bold text-[#2B2320] dark:text-[#E8E0D8]">{tc('mira')}</span>
              {isActive ? (
                <span className="text-[11px] text-[#7A9E7E]">{tc('sessionInProgress')}</span>
              ) : (
                <span className="text-[11px] text-[#9A8880] dark:text-[#A09A93]">
                  {format(new Date(session.createdAt), 'MMM d, yyyy · HH:mm')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isActive && <EndSessionButton onEnd={handleEnd} disabled={isStreaming} />}
            {(session.status === 'completed' || analysisReady) && (
              <Link
                href={`/dashboard/chat/${sessionId}/analysis`}
                className="flex items-center gap-1.5 rounded-xl bg-[#FFF8F0] px-3 py-1.5 dark:bg-[#2A211B]"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#C4856F] dark:text-[#D4A89A]" />
                <span className="text-[13px] font-semibold text-[#C4856F] dark:text-[#D4A89A]">{tc('viewAnalysis')}</span>
              </Link>
            )}
          </div>
        </div>
        <div className="h-px bg-[#F0E4DE] dark:bg-[#3A332E]" />
      </div>

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
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0E4DE] bg-[#FFF8F0] px-5 py-2.5 dark:border-[#3A332E] dark:bg-[#2A211B]">
          <p className="text-sm text-[#9A8880] dark:text-[#A09A93]">{tc('sessionEnded')}</p>
          <button
            onClick={handleNewSession}
            disabled={startingSession}
            className="flex items-center gap-1.5 rounded-xl bg-[#C4856F] px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50 dark:bg-[#D4A89A] dark:text-[#1A1614]"
          >
            <Plus className="h-3.5 w-3.5" />
            {startingSession ? tc('creating') : tc('newSession')}
          </button>
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
