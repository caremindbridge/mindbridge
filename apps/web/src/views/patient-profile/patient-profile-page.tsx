'use client';

import type { ProfileAnalysis } from '@mindbridge/types/src/therapist';
import { format, formatDistanceToNow } from 'date-fns';
import { Activity, ArrowLeft, BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { usePatientReports, useReport } from '@/entities/report';
import { usePatientProfile } from '@/entities/therapist';
import { PatientDossier } from '@/features/profile';
import { GenerateReportDialog } from '@/features/report';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MarkdownMessage,
  ScrollArea,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';
import { AnxietyChart, StatCard } from '@/widgets/patient-dashboard';

interface PatientProfilePageProps {
  patientId: string;
}

export function PatientProfilePage({ patientId }: PatientProfilePageProps) {
  const t = useTranslations('therapist');
  const { data: profile, isLoading } = usePatientProfile(patientId);
  const [reportOpen, setReportOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">{t('patientNotFound')}</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/therapist">{t('backToPatients')}</Link>
        </Button>
      </div>
    );
  }

  const latestAnalysis = profile.analyses[0];
  const avgAnxiety =
    profile.analyses.length
      ? +(
          profile.analyses.reduce((s, a) => s + (a.anxietyLevel ?? 0), 0) /
          profile.analyses.length
        ).toFixed(1)
      : null;
  const avgDepression =
    profile.analyses.length
      ? +(
          profile.analyses.reduce((s, a) => s + (a.depressionLevel ?? 0), 0) /
          profile.analyses.length
        ).toFixed(1)
      : null;

  const moodChartData = [...profile.moods]
    .reverse()
    .map((m) => ({ date: format(new Date(m.createdAt), 'MMM d'), mood: m.value }));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/therapist">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{profile.patient.email}</h1>
            {profile.connectedAt && (
              <p className="text-xs text-muted-foreground">
                {t('connectedAgo')} {formatDistanceToNow(new Date(profile.connectedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <Button onClick={() => setReportOpen(true)}>{t('generateReport')}</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label={t('avgAnxiety')}
          value={avgAnxiety ?? '—'}
          description={t('outOf10')}
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label={t('avgDepression')}
          value={avgDepression ?? '—'}
          description={t('outOf10')}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label={t('avgMood')}
          value={profile.moodStats.avgMood != null ? profile.moodStats.avgMood.toFixed(1) : '—'}
          description={t('outOf10')}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t('moodEntries')}
          value={profile.moodStats.totalEntries}
        />
      </div>

      {/* Risk flag */}
      {latestAnalysis?.riskFlags && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          ⚠️ <strong>{t('riskFlagLabel')}:</strong> {latestAnalysis.riskFlags}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="mood">
        <TabsList>
          <TabsTrigger value="mood">{t('moodTab')}</TabsTrigger>
          <TabsTrigger value="analysis">{t('analysisTab')}</TabsTrigger>
          <TabsTrigger value="reports">{t('reportsTab')}</TabsTrigger>
          <TabsTrigger value="dossier">{t('dossierTab')}</TabsTrigger>
        </TabsList>

        {/* --- Mood Tab --- */}
        <TabsContent value="mood" className="space-y-6 pt-4">
          {/* Mood Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('moodOverTime')}</CardTitle>
            </CardHeader>
            <CardContent>
              {moodChartData.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                  {t('noMoodData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={moodChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[1, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      name={t('moodTab')}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Emotion Distribution */}
          {profile.emotionDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('emotionDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.emotionDistribution.map(({ emotion, count }) => {
                    const max = profile.emotionDistribution[0]?.count ?? 1;
                    return (
                      <div key={emotion} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{emotion}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* --- Analysis Tab --- */}
        <TabsContent value="analysis" className="pt-4">
          <div className="space-y-4">
            <AnxietyChart analyses={profile.analyses} />
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {profile.analyses.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('noAnalyses')}
                  </p>
                ) : (
                  profile.analyses.map((a) => <AnalysisCard key={a.id} analysis={a} />)
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* --- Reports Tab --- */}
        <TabsContent value="reports" className="pt-4">
          <ReportsTab patientId={patientId} onGenerate={() => setReportOpen(true)} />
        </TabsContent>

        {/* --- Dossier Tab --- */}
        <TabsContent value="dossier" className="pt-4">
          <PatientDossier patientId={patientId} />
        </TabsContent>
      </Tabs>

      <GenerateReportDialog
        patientId={patientId}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: ProfileAnalysis }) {
  const t = useTranslations('therapist');
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <CardContent className="p-4">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {format(new Date(analysis.createdAt), 'MMM d, yyyy')}
            </span>
            <Badge variant={analysis.anxietyLevel != null && analysis.anxietyLevel >= 7 ? 'destructive' : 'secondary'}>
              {t('anxietyBadge')} {analysis.anxietyLevel ?? '—'}
            </Badge>
            <Badge variant="outline">
              {t('depressionBadge')} {analysis.depressionLevel ?? '—'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {analysis.moodInsight && (
              <div className="text-sm text-muted-foreground">
                <MarkdownMessage content={analysis.moodInsight} />
              </div>
            )}
            {analysis.keyEmotions && analysis.keyEmotions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {analysis.keyEmotions.map((e) => (
                  <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                ))}
              </div>
            )}
            {analysis.riskFlags && (
              <div className="text-xs text-destructive">
                ⚠️ <MarkdownMessage content={analysis.riskFlags} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportsTab({ patientId, onGenerate }: { patientId: string; onGenerate: () => void }) {
  const t = useTranslations('therapist');
  const { data: reports, isLoading } = usePatientReports(patientId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={onGenerate}>
          {t('generateReport')}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!reports || reports.length === 0) && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('noReports')}
        </p>
      )}

      {reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportRow
              key={r.id}
              reportId={r.id}
              createdAt={r.createdAt}
              periodStart={r.periodStart}
              periodEnd={r.periodEnd}
              initialStatus={r.status}
              expanded={expandedId === r.id}
              onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportRow({
  reportId,
  createdAt,
  periodStart,
  periodEnd,
  initialStatus,
  expanded,
  onToggle,
}: {
  reportId: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  initialStatus: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('therapist');
  const { data: report } = useReport(expanded ? reportId : null);

  const [knownStatus, setKnownStatus] = useState(initialStatus);
  if (report?.status && report.status !== knownStatus) {
    setKnownStatus(report.status);
  }

  const statusVariant =
    knownStatus === 'ready' ? 'default' : knownStatus === 'error' ? 'destructive' : 'secondary';

  return (
    <Card>
      <CardContent className="p-4">
        <button className="flex w-full items-center justify-between text-left" onClick={onToggle}>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {format(new Date(periodStart), 'MMM d')} – {format(new Date(periodEnd), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('generated')} {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{knownStatus}</Badge>
            <span className="text-xs text-muted-foreground">{expanded ? '▲' : '▼'}</span>
          </div>
        </button>

        {expanded && report?.status === 'generating' && (
          <div className="mt-3 space-y-2 border-t pt-3">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        )}

        {expanded && report?.status === 'error' && (
          <div className="mt-3 border-t pt-3">
            <p className="text-xs font-medium text-destructive">{t('reportFailed')}</p>
            {report.errorMessage && (
              <p className="mt-1 text-xs text-muted-foreground">{report.errorMessage}</p>
            )}
          </div>
        )}

        {expanded && report?.status === 'ready' && report.content && (
          <div className="mt-3 space-y-3 border-t pt-3">
            <div className="text-sm">
              <MarkdownMessage content={report.content.summary} />
            </div>
            <Separator />
            {report.content.keyThemes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {report.content.keyThemes.map((t) => (
                  <Badge key={t} variant="secondary">{t.replace(/\*\*/g, '')}</Badge>
                ))}
              </div>
            )}
            {report.content.suggestedFocus && (
              <div className="rounded-md border border-blush-200 bg-blush-50 p-3 text-sm">
                <p className="mb-1 font-semibold">{t('focusTitle')}</p>
                <MarkdownMessage content={report.content.suggestedFocus} />
              </div>
            )}
            {report.content.riskFlags && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                <MarkdownMessage content={report.content.riskFlags} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
