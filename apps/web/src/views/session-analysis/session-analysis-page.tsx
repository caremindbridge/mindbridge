'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { ArrowLeft, Check, Loader2, Sparkles, Tag, Timer } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAnalysis } from '@/entities/analysis';
import { useSession } from '@/entities/session';
import { useUser } from '@/entities/user';
import { createSession } from '@/shared/api/client';
import { analytics } from '@/shared/lib/analytics';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui';
import { AnalysisReport } from '@/widgets/analysis-report';

import { PatientSessionSummary } from './patient-session-summary';

interface SessionAnalysisPageProps {
  sessionId: string;
  direct?: boolean;
}

function StepItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-xl',
          done ? 'bg-[#E8F2E9] dark:bg-[#1A2E1C]' : 'bg-[#FFF8F0] dark:bg-[#2A211B]',
        )}
      >
        {done ? (
          <Check className="h-3.5 w-3.5 text-[#7A9E7E]" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C4856F]" />
        )}
      </div>
      <span className={cn('text-[13px] font-medium', done ? 'text-[#7A9E7E]' : 'text-[#C4856F]')}>
        {label}
      </span>
    </div>
  );
}

interface LoadingScreenProps {
  sessionId: string;
  isReady: boolean;
  onViewAnalysis: () => void;
}

function AnalysisLoadingScreen({ sessionId, isReady, onViewAnalysis }: LoadingScreenProps) {
  const t = useTranslations('chat');
  const router = useRouter();
  const { data: session } = useSession(sessionId);
  const [activeStep, setActiveStep] = useState(0);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(1), 1000);
    const t2 = setTimeout(() => setActiveStep(2), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const duration = useMemo(() => {
    if (!session) return null;
    const start = new Date(session.createdAt).getTime();
    const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
    return Math.max(1, Math.round((end - start) / 60000));
  }, [session]);

  const handleNewSession = useCallback(async () => {
    setStarting(true);
    try {
      const s = await createSession();
      analytics.sessionStarted(s.id);
      router.push(`/dashboard/chat/${s.id}`);
    } catch {
      setStarting(false);
    }
  }, [router]);

  const steps = [
    { label: t('analysisLoadingStep1'), done: activeStep >= 1 },
    { label: t('analysisLoadingStep2'), done: activeStep >= 2 },
    { label: t('analysisLoadingStep3'), done: false },
  ];

  return (
    <div className="flex h-full flex-col bg-[#F7F3EE] dark:bg-[#1A1714]">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold text-[#2B2320] dark:text-[#E8E0D8]">{t('analysisLoadingTitle')}</h1>
            <p className="text-sm text-[#9A8880] dark:text-[#7A706A]">{t('analysisLoadingSubtitle')}</p>
          </div>

          {/* Overview card */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_#2B232009] dark:bg-[#221E1B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-[#9A8880] dark:text-[#7A706A]" />
                <span className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">{t('analysisLoadingDuration')}</span>
              </div>
              <span className="text-[13px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">
                {duration != null ? t('analysisLoadingMinutes', { count: duration }) : '—'}
              </span>
            </div>
            {session?.title && (
              <>
                <div className="h-px bg-[#F0E4DE] dark:bg-[#3A332E]" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#9A8880] dark:text-[#7A706A]" />
                    <span className="text-[13px] text-[#9A8880] dark:text-[#7A706A]">{t('analysisLoadingTopic')}</span>
                  </div>
                  <span className="max-w-[180px] truncate text-right text-[13px] font-semibold text-[#2B2320] dark:text-[#E8E0D8]">
                    {session.title}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Loading card / Ready card */}
          {isReady ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-6 shadow-[0_2px_12px_#2B232009] dark:bg-[#221E1B]">
              {/* Green check circle */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F2E9] dark:bg-[#1A2E1C]">
                <Check className="h-7 w-7 text-[#7A9E7E]" />
              </div>

              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-[15px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">{t('analysisReadyTitle')}</p>
                <p className="text-[13px] leading-relaxed text-[#9A8880] dark:text-[#7A706A]">
                  {t('analysisReadyDesc')}
                </p>
              </div>

              {/* View Analysis CTA inside card */}
              <button
                onClick={onViewAnalysis}
                className="send-button-gradient flex h-12 w-full items-center justify-center gap-2 rounded-[14px] text-sm font-bold text-white shadow-[0_4px_12px_#C4856F30]"
              >
                <Sparkles className="h-4 w-4" />
                {t('analysisReadyBtn')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-6 shadow-[0_2px_12px_#2B232009] dark:bg-[#221E1B]">
              {/* Spinner */}
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-[#F0E4DE] dark:border-[#3A332E]" />
                <div
                  className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-[#C4856F] border-t-[#C4856F]"
                  style={{ animationDuration: '1.5s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#C4856F]" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-[15px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">
                  {t('analysisLoadingPreparing')}
                </p>
                <p className="text-[13px] leading-relaxed text-[#9A8880] dark:text-[#7A706A]">
                  {t('analysisLoadingPreparingDesc')}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2.5">
                {steps.map((step, i) => (
                  <StepItem key={i} done={step.done} label={step.label} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons — always pinned to bottom */}
      <div className="flex shrink-0 flex-col gap-2 bg-[#F7F3EE] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3 dark:bg-[#1A1714]">
        <button
          onClick={handleNewSession}
          disabled={starting}
          className="send-button-gradient flex h-11 w-full items-center justify-center rounded-[14px] text-sm font-bold text-white shadow-[0_4px_12px_#C4856F30] disabled:opacity-60"
        >
          {t('analysisLoadingStartNew')}
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex h-11 w-full items-center justify-center rounded-[14px] border border-[#F0E4DE] bg-white text-sm font-semibold text-[#9A8880] dark:border-[#3A332E] dark:bg-[#221E1B] dark:text-[#7A706A]"
        >
          {t('analysisLoadingBackHome')}
        </button>
      </div>
    </div>
  );
}

export function SessionAnalysisPage({ sessionId, direct }: SessionAnalysisPageProps) {
  const t = useTranslations('chat');
  const { user } = useUser();
  const { analysis } = useAnalysis(sessionId);
  const [viewingAnalysis, setViewingAnalysis] = useState(direct ?? false);

  const isTherapistView =
    user?.role === UserRole.THERAPIST && (user.activeMode ?? 'therapist') === 'therapist';

  useEffect(() => {
    if (analysis && viewingAnalysis) analytics.analysisViewed(sessionId);
  }, [analysis, viewingAnalysis, sessionId]);

  if (!viewingAnalysis || analysis === null) {
    return (
      <AnalysisLoadingScreen
        sessionId={sessionId}
        isReady={analysis !== null}
        onViewAnalysis={() => setViewingAnalysis(true)}
      />
    );
  }

  if (!isTherapistView) {
    return <PatientSessionSummary analysis={analysis} sessionId={sessionId} />;
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/chat/${sessionId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('analysisTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('analysisSubtitle')}</p>
        </div>
      </div>
      <AnalysisReport analysis={analysis} />
    </div>
  );
}
