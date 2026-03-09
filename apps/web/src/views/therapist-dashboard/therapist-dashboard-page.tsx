'use client';

import type { PatientSummary } from '@mindbridge/types/src/therapist';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Search, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useTherapistFeatures } from '@/entities/subscription';
import { usePatients } from '@/entities/therapist';
import { InvitePatientDialog } from '@/features/therapist';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { cn } from '@/shared/lib/utils';
import { Button, Card, CardContent, ErrorCard, Input, Skeleton } from '@/shared/ui';

const STATUS_COLOR_CLASS: Record<PatientSummary['statusColor'], string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
};

function PatientCard({ patient }: { patient: PatientSummary }) {
  const t = useTranslations('therapist');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const displayName = patient.patient.name || patient.patient.email;
  const lastSeen = patient.lastActivity
    ? formatDistanceToNow(new Date(patient.lastActivity), { addSuffix: true })
    : t('never');

  return (
    <Link href={`/dashboard/therapist/patients/${patient.patient.id}`}>
      <Card className="cursor-pointer transition-all hover:bg-muted/50 active:scale-[0.99]">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3">
            <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', STATUS_COLOR_CLASS[patient.statusColor])} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium">{displayName}</p>
                {patient.riskFlags && <span className="shrink-0 text-xs">⚠️</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isDesktop && patient.patient.name && `${patient.patient.email} · `}
                {lastSeen}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  'text-sm font-semibold',
                  patient.anxietyLevel != null && patient.anxietyLevel >= 7
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {patient.anxietyLevel ?? '—'}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TherapistDashboardPage() {
  const t = useTranslations('therapist');
  const tc = useTranslations('common');
  const { data: patients, isLoading, error, refetch } = usePatients();
  const { data: features } = useTherapistFeatures();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const trialDaysLeft =
    features?.isTrial && features.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(features.trialEndsAt).getTime() - Date.now()) / 86400000))
      : null;

  const filtered = useMemo(
    () =>
      (patients ?? []).filter((p) => {
        const q = search.toLowerCase();
        return (
          p.patient.email.toLowerCase().includes(q) ||
          (p.patient.name?.toLowerCase().includes(q) ?? false)
        );
      }),
    [patients, search],
  );

  if (error) {
    return <ErrorCard message={error.message} retryLabel={tc('tryAgain')} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">
      <div className="space-y-4 p-4 md:p-6">
        {/* Trial banner */}
        {trialDaysLeft !== null && (
          <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('trialBannerTitle', { days: trialDaysLeft })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('trialBannerDesc')}</p>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <a href="/pricing?role=therapist">{t('upgrade')}</a>
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold md:text-2xl">
              {t('myPatients')}{!isLoading && ` (${patients?.length ?? 0})`}
            </h1>
            {features && features.patientLimit > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('patientCounter', { used: features.activePatientCount, limit: features.patientLimit })}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t('invitePatient')}</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchPatients')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-base"
          />
        </div>

        {/* List */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="mb-1 text-base font-medium">
              {search ? t('noMatch') : t('noPatients')}
            </h3>
            {!search && (
              <>
                <p className="mb-4 max-w-sm text-sm text-muted-foreground">{t('inviteFirst')}</p>
                <Button size="sm" onClick={() => setInviteOpen(true)}>{t('invitePatient')}</Button>
              </>
            )}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2 md:space-y-3">
            {filtered.map((p) => (
              <PatientCard key={p.linkId} patient={p} />
            ))}
          </div>
        )}
      </div>

      <InvitePatientDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
