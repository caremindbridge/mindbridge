'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useGenerateReport, useReport } from '@/entities/report';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Skeleton,
} from '@/shared/ui';

interface GenerateReportDialogProps {
  patientId: string;
  open: boolean;
  onClose: () => void;
}

export function GenerateReportDialog({ patientId, open, onClose }: GenerateReportDialogProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthAgo = format(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    'yyyy-MM-dd',
  );
  const [periodStart, setPeriodStart] = useState(monthAgo);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useGenerateReport();
  const { data: report } = useReport(reportId);

  useEffect(() => {
    if (report?.status === 'ready') toast.success('Report ready!');
    if (report?.status === 'error') toast.error('Report generation failed');
  }, [report?.status]);

  const handleClose = () => {
    setReportId(null);
    setError(null);
    onClose();
  };

  const handleGenerate = async () => {
    setError(null);
    try {
      const r = await generate.mutateAsync({ patientId, periodStart, periodEnd });
      setReportId(r.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  const isGenerating = !!reportId && report?.status === 'generating';
  const isReady = report?.status === 'ready';
  const isError = report?.status === 'error';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Therapist Report</DialogTitle>
        </DialogHeader>

        {/* Form — show until we have a report id */}
        {!reportId && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period-start">Period start</Label>
                <input
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-end">Period end</Label>
                <input
                  id="period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleGenerate} disabled={generate.isPending}>
                {generate.isPending ? 'Starting...' : 'Generate'}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Generating report, please wait...</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="space-y-4">
            <p className="text-sm text-destructive">
              {report?.errorMessage ?? 'Report generation failed.'}
            </p>
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}

        {/* Ready state */}
        {isReady && report?.content && (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <p className="text-sm leading-relaxed">{report.content.summary}</p>

            {report.content.moodTrend && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mood Trend
                </p>
                <p className="text-sm text-muted-foreground">{report.content.moodTrend}</p>
              </div>
            )}

            {report.content.keyThemes.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Key Themes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.content.keyThemes.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {report.content.concerns.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Concerns
                </p>
                <ul className="space-y-1">
                  {report.content.concerns.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm">
                      <span>⚠️</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.content.copingStrategiesUsed.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Coping Strategies
                </p>
                <ul className="space-y-1">
                  {report.content.copingStrategiesUsed.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm">
                      <span>✅</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.content.progressNotes && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Progress Notes
                </p>
                <p className="text-sm text-muted-foreground">{report.content.progressNotes}</p>
              </div>
            )}

            {report.content.suggestedFocus && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Suggested Focus
                </p>
                <p className="text-sm">{report.content.suggestedFocus}</p>
              </div>
            )}

            {report.content.riskFlags && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-destructive">
                  Risk Flags
                </p>
                <p className="text-sm text-destructive">{report.content.riskFlags}</p>
              </div>
            )}

            <Button className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
