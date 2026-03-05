'use client';

import type { PatientSummary } from '@mindbridge/types/src/therapist';
import { formatDistanceToNow } from 'date-fns';
import { Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { usePatients } from '@/entities/therapist';
import { InvitePatientDialog } from '@/features/therapist';
import {
  Badge,
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

function anxietyVariant(level: number | null): 'default' | 'secondary' | 'destructive' {
  if (level === null) return 'secondary';
  if (level >= 7) return 'destructive';
  if (level >= 5) return 'default';
  return 'secondary';
}

function PatientCard({
  patient,
  onClick,
}: {
  patient: PatientSummary;
  onClick: () => void;
}) {
  const lastSeen = patient.lastActivity
    ? formatDistanceToNow(new Date(patient.lastActivity), { addSuffix: true })
    : 'Never';

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
            <p className="truncate font-medium">{patient.patient.email}</p>
            {patient.riskFlags && (
              <p className="mt-0.5 text-xs text-destructive">⚠️ {patient.riskFlags}</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">Last activity: {lastSeen}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">
              Mood {patient.avgMood != null ? patient.avgMood.toFixed(1) : '—'}
            </Badge>
            <Badge variant={anxietyVariant(patient.anxietyLevel)}>
              Anxiety {patient.anxietyLevel ?? '—'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TherapistDashboardPage() {
  const { data: patients, isLoading, error, refetch } = usePatients();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = useMemo(
    () =>
      (patients ?? []).filter((p) =>
        p.patient.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [patients, search],
  );

  if (error) {
    return <ErrorCard message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            My Patients ({isLoading ? '…' : (patients?.length ?? 0)})
          </h1>
          <p className="text-muted-foreground">Manage your connected patients</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Invite Patient</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by email..."
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
            {search ? 'No patients match your search' : 'No patients yet'}
          </h3>
          {!search && (
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              Invite your first patient using their email address.
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
