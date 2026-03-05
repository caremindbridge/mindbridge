'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { usePatientProfile } from '@/entities/therapist';
import type { ProfileAnalysis } from '@mindbridge/types/src/therapist';
import { GenerateReportDialog } from '@/features/report';
import { usePatientReports, useReport } from '@/entities/report';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';
import { AnxietyChart, StatCard } from '@/widgets/patient-dashboard';
import { BarChart3, TrendingDown, TrendingUp, Activity } from 'lucide-react';

interface PatientProfilePageProps {
  patientId: string;
}

export function PatientProfilePage({ patientId }: PatientProfilePageProps) {
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
        <p className="text-muted-foreground">Patient not found</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/therapist">Back to patients</Link>
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
                Connected {formatDistanceToNow(new Date(profile.connectedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <Button onClick={() => setReportOpen(true)}>Generate Report</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Avg Anxiety"
          value={avgAnxiety ?? '—'}
          description="out of 10"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Avg Depression"
          value={avgDepression ?? '—'}
          description="out of 10"
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Avg Mood"
          value={profile.moodStats.avgMood != null ? profile.moodStats.avgMood.toFixed(1) : '—'}
          description="out of 10"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Mood Entries"
          value={profile.moodStats.totalEntries}
        />
      </div>

      {/* Risk flag */}
      {latestAnalysis?.riskFlags && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          ⚠️ <strong>Risk Flag:</strong> {latestAnalysis.riskFlags}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="mood">
        <TabsList>
          <TabsTrigger value="mood">Mood</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* --- Mood Tab --- */}
        <TabsContent value="mood" className="space-y-6 pt-4">
          {/* Mood Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {moodChartData.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                  No mood data available
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
                      name="Mood"
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
                <CardTitle>Emotion Distribution</CardTitle>
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
                    No session analyses yet
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
              Anxiety {analysis.anxietyLevel ?? '—'}
            </Badge>
            <Badge variant="outline">
              Depression {analysis.depressionLevel ?? '—'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {analysis.moodInsight && (
              <p className="text-sm text-muted-foreground">{analysis.moodInsight}</p>
            )}
            {analysis.keyEmotions && analysis.keyEmotions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {analysis.keyEmotions.map((e) => (
                  <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                ))}
              </div>
            )}
            {analysis.riskFlags && (
              <p className="text-xs text-destructive">⚠️ {analysis.riskFlags}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportsTab({ patientId, onGenerate }: { patientId: string; onGenerate: () => void }) {
  const { data: reports, isLoading } = usePatientReports(patientId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={onGenerate}>
          Generate Report
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
          No reports yet. Generate the first one.
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
  expanded,
  onToggle,
}: {
  reportId: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: report } = useReport(expanded ? reportId : null);

  const statusVariant =
    report?.status === 'ready'
      ? 'default'
      : report?.status === 'error'
        ? 'destructive'
        : 'secondary';

  return (
    <Card>
      <CardContent className="p-4">
        <button className="flex w-full items-center justify-between text-left" onClick={onToggle}>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {format(new Date(periodStart), 'MMM d')} – {format(new Date(periodEnd), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-muted-foreground">
              Generated {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{report?.status ?? 'loading'}</Badge>
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

        {expanded && report?.status === 'ready' && report.content && (
          <div className="mt-3 space-y-3 border-t pt-3">
            <p className="text-sm">{report.content.summary}</p>
            <Separator />
            {report.content.keyThemes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {report.content.keyThemes.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            )}
            {report.content.suggestedFocus && (
              <div className="rounded-md border border-blush-200 bg-blush-50 p-2 text-sm">
                <strong>Focus:</strong> {report.content.suggestedFocus}
              </div>
            )}
            {report.content.riskFlags && (
              <p className="text-sm text-destructive">⚠️ {report.content.riskFlags}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
