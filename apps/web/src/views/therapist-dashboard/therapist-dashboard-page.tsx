'use client';

import type { PatientSummary } from '@mindbridge/types/src/therapist';
import { formatDistanceToNow } from 'date-fns';
import { Search, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { usePatients } from '@/entities/therapist';
import { InvitePatientDialog } from '@/features/therapist';
import {
  Button,
  Card,
  CardContent,
  ErrorCard,
  Input,
  Skeleton,
} from '@/shared/ui';

const STATUS_COLOR_CLASS: Record<PatientSummary['statusColor'], string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
};

function PatientCard({
  patient,
  onClick,
}: {
  patient: PatientSummary;
  onClick: () => void;
}) {
  const t = useTranslations('therapist');
  const displayName = patient.patient.name || patient.patient.email;
  const lastSeen = patient.lastActivity
    ? formatDistanceToNow(new Date(patient.lastActivity), { addSuffix: true })
    : t('never');

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 shrink-0 rounded-full ${STATUS_COLOR_CLASS[patient.statusColor]}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{displayName}</p>
            {patient.patient.name && (
              <p className="truncate text-xs text-muted-foreground">{patient.patient.email}</p>
            )}
            {patient.riskFlags && (
              <p className="mt-0.5 line-clamp-1 text-xs text-destructive">⚠️ {patient.riskFlags}</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">{t('lastActivity')} {lastSeen}</p>
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p>
              {t('moodBadge')}:{' '}
              <span className="font-medium text-foreground">
                {patient.avgMood != null ? patient.avgMood.toFixed(1) : '—'}
              </span>
            </p>
            <p>
              {t('anxietyBadge')}:{' '}
              <span
                className={`font-medium ${
                  patient.anxietyLevel != null && patient.anxietyLevel >= 7
                    ? 'text-destructive'
                    : 'text-foreground'
                }`}
              >
                {patient.anxietyLevel ?? '—'}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TherapistDashboardPage() {
  const t = useTranslations('therapist');
  const tc = useTranslations('common');
  const { data: patients, isLoading, error, refetch } = usePatients();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

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
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('myPatients')} ({isLoading ? '…' : (patients?.length ?? 0)})
          </h1>
          <p className="text-muted-foreground">{t('managePatients')}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>{t('invitePatient')}</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchPatients')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            {search ? t('noMatch') : t('noPatients')}
          </h3>
          {!search && (
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              {t('inviteFirst')}
            </p>
          )}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((p) => (
            <PatientCard
              key={p.linkId}
              patient={p}
              onClick={() => router.push(`/dashboard/therapist/patients/${p.patient.id}`)}
            />
          ))}
        </div>
      )}

      <InvitePatientDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
