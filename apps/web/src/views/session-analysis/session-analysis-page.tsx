'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { useAnalysis } from '@/entities/analysis';
import { useUser } from '@/entities/user';
import { Button, Skeleton } from '@/shared/ui';
import { AnalysisReport } from '@/widgets/analysis-report';

import { PatientSessionSummary } from './patient-session-summary';

interface SessionAnalysisPageProps {
  sessionId: string;
}

export function SessionAnalysisPage({ sessionId }: SessionAnalysisPageProps) {
  const t = useTranslations('chat');
  const { user } = useUser();
  const { analysis, isLoading, error } = useAnalysis(sessionId);

  const isTherapistView =
    user?.role === UserRole.THERAPIST && (user.activeMode ?? 'therapist') === 'therapist';

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  // Patient (or therapist in patient mode) → warm summary
  if (!isTherapistView) {
    return <PatientSessionSummary analysis={analysis} sessionId={sessionId} />;
  }

  // Therapist → full clinical report
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
