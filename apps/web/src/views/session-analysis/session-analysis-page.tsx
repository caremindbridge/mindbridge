'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { useAnalysis } from '@/entities/analysis';
import { Button, Skeleton } from '@/shared/ui';
import { AnalysisReport } from '@/widgets/analysis-report';

interface SessionAnalysisPageProps {
  sessionId: string;
}

export function SessionAnalysisPage({ sessionId }: SessionAnalysisPageProps) {
  const { analysis, isLoading, error } = useAnalysis(sessionId);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/chat/${sessionId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Session Analysis</h1>
          <p className="text-sm text-muted-foreground">
            CBT session insights and recommendations
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {analysis && <AnalysisReport analysis={analysis} />}
    </div>
  );
}
