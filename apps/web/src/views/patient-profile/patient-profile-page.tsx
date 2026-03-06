'use client';

import type { ProfileAnalysis } from '@mindbridge/types/src/therapist';
import { format, formatDistanceToNow } from 'date-fns';
import { Activity, ArrowLeft, BarChart3, ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
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
      <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 lg:pb-0">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
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

  const displayName = profile.patient.name || profile.patient.email;

  return (
    <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">
      <div className="space-y-4 p-4 md:space-y-6 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button variant="ghost" size="icon" className="-ml-2 shrink-0" asChild>
              <Link href="/dashboard/therapist">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold md:text-xl">{displayName}</h1>
              {profile.patient.name && (
                <p className="truncate text-xs text-muted-foreground">{profile.patient.email}</p>
              )}
            </div>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => setReportOpen(true)}>
            <BarChart3 className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t('generateReport')}</span>
          </Button>
        </div>

        {/* Stat Cards — 3 cols mobile, 4 desktop */}
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-4">
          <StatCard compact icon={<Activity className="h-4 w-4" />} label={t('avgAnxiety')} value={avgAnxiety ?? '—'} />
          <StatCard compact icon={<TrendingDown className="h-4 w-4" />} label={t('avgDepression')} value={avgDepression ?? '—'} />
          <StatCard compact icon={<BarChart3 className="h-4 w-4" />} label={t('avgMood')} value={profile.moodStats.avgMood != null ? profile.moodStats.avgMood.toFixed(1) : '—'} />
          <div className="hidden md:block">
            <StatCard compact icon={<TrendingUp className="h-4 w-4" />} label={t('moodEntries')} value={profile.moodStats.totalEntries} />
          </div>
        </div>

        {/* Risk flag */}
        {latestAnalysis?.riskFlags && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            ⚠️ <strong>{t('riskFlagLabel')}:</strong> {latestAnalysis.riskFlags}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="mood">
          <TabsList className="mb-2 grid w-full grid-cols-4 rounded-lg p-1">
            <TabsTrigger value="mood" className="text-xs md:text-sm">{t('moodTab')}</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs md:text-sm">{t('analysisTab')}</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs md:text-sm">{t('reportsTab')}</TabsTrigger>
            <TabsTrigger value="dossier" className="text-xs md:text-sm">{t('dossierTab')}</TabsTrigger>
          </TabsList>

          {/* Mood Tab */}
          <TabsContent value="mood" className="space-y-4 pt-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base">{t('moodOverTime')}</CardTitle>
              </CardHeader>
              <CardContent>
                {moodChartData.length === 0 ? (
                  <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
                    {t('noMoodData')}
                  </div>
                ) : (
                  <div className="h-[180px] w-full overflow-hidden md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={moodChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
                        <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} width={24} />
                        <Tooltip />
                        <Line type="monotone" dataKey="mood" name={t('moodTab')} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base">{t('emotionDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.emotionDistribution.length === 0 ? (
                  <div className="flex h-[80px] items-center justify-center text-sm text-muted-foreground">
                    {t('noEmotionDistribution')}
                  </div>
                ) : (
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
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="pt-2">
            <div className="space-y-4">
              <AnxietyChart analyses={profile.analyses} />
              <div className="space-y-3">
                {profile.analyses.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t('noAnalyses')}</p>
                ) : (
                  profile.analyses.map((a) => <AnalysisCard key={a.id} analysis={a} />)
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="pt-2">
            <ReportsTab patientId={patientId} onGenerate={() => setReportOpen(true)} />
          </TabsContent>

          {/* Dossier Tab */}
          <TabsContent value="dossier" className="pt-2">
            <PatientDossier patientId={patientId} />
          </TabsContent>
        </Tabs>
      </div>

      <GenerateReportDialog patientId={patientId} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}

const EMOTION_RU: Record<string, string> = {
  anxiety: 'Тревога', sadness: 'Грусть', joy: 'Радость', calm: 'Спокойствие',
  irritation: 'Раздражение', fear: 'Страх', anger: 'Злость', hope: 'Надежда',
  loneliness: 'Одиночество', gratitude: 'Благодарность', guilt: 'Вина',
  shame: 'Стыд', frustration: 'Разочарование', stress: 'Стресс',
  overwhelm: 'Перегруженность', panic: 'Паника', worry: 'Беспокойство',
  relief: 'Облегчение', contentment: 'Удовлетворение', grief: 'Горе',
};

function AnalysisCard({ analysis }: { analysis: ProfileAnalysis }) {
  const t = useTranslations('therapist');
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const localizeEmotion = (e: string) => (locale === 'ru' ? (EMOTION_RU[e.toLowerCase()] ?? e) : e);

  return (
    <Card>
      <CardContent className="p-4">
        <button
          className="flex w-full items-start justify-between gap-2 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="min-w-0 space-y-1.5">
            <span className="block text-sm font-medium">
              {format(new Date(analysis.createdAt), 'MMM d, yyyy')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={analysis.anxietyLevel != null && analysis.anxietyLevel >= 7 ? 'destructive' : 'secondary'}>
                {t('anxietyBadge')} {analysis.anxietyLevel ?? '—'}
              </Badge>
              <Badge variant="outline">
                {t('depressionBadge')} {analysis.depressionLevel ?? '—'}
              </Badge>
            </div>
          </div>
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
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
                  <Badge key={e} variant="secondary" className="text-xs">{localizeEmotion(e)}</Badge>
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
  const statusLabel =
    knownStatus === 'ready'
      ? t('reportStatusReady')
      : knownStatus === 'error'
        ? t('reportStatusError')
        : t('reportStatusGenerating');

  return (
    <Card>
      <CardContent className="p-4">
        <button className="flex w-full items-start justify-between gap-2 text-left" onClick={onToggle}>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">
              {format(new Date(periodStart), 'MMM d')} – {format(new Date(periodEnd), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('generated')} {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            <span className="text-muted-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
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
          <div className="mt-3 min-w-0 space-y-3 overflow-hidden border-t pt-3">
            <div className="min-w-0 text-sm">
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
