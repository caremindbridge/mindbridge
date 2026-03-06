'use client';

import { SessionStatus } from '@mindbridge/types/src/chat';
import { format } from 'date-fns';
import { BarChart3, MessageCircle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useSessions } from '@/entities/session';
import { StartSessionButton } from '@/features/chat';
import { deleteSession } from '@/shared/api/client';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/shared/ui';

function anxietyBadgeClass(level: number): string {
  if (level <= 3) return 'border-green-200 bg-green-50 text-green-700';
  if (level <= 6) return 'border-yellow-200 bg-yellow-50 text-yellow-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [SessionStatus.Active]: 'default',
  [SessionStatus.Ended]: 'secondary',
  [SessionStatus.Analyzing]: 'outline',
  [SessionStatus.Completed]: 'secondary',
};

export function ChatSessionsPage() {
  const t = useTranslations('chat');
  const { data, isLoading } = useSessions();
  const qc = useQueryClient();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      qc.invalidateQueries({ queryKey: ['sessions'] });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('sessionsTitle')}</h1>
          <p className="text-muted-foreground">{t('sessionsSubtitle')}</p>
        </div>
        <StartSessionButton />
      </div>

      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && data?.sessions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">{t('noSessionsTitle')}</h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              {t('noSessionsDesc')}
            </p>
            <StartSessionButton />
          </CardContent>
        </Card>
      )}

      {data?.sessions && data.sessions.length > 0 && (
        <div className="grid gap-4">
          {data.sessions.map((session) => (
            <Link key={session.id} href={`/dashboard/chat/${session.id}`}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {t('cbtSession')} · {format(new Date(session.createdAt), 'MMM d, yyyy')}
                      </CardTitle>
                      <CardDescription>{format(new Date(session.createdAt), 'HH:mm')}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[session.status]}>
                        {t(`status${session.status.charAt(0).toUpperCase() + session.status.slice(1)}` as 'statusActive')}
                      </Badge>
                      {session.status === SessionStatus.Analyzing && (
                        <span className="h-4 w-16 animate-pulse rounded bg-muted" />
                      )}
                      {session.status === SessionStatus.Completed &&
                        session.analysis?.anxietyLevel != null && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${anxietyBadgeClass(session.analysis.anxietyLevel)}`}
                          >
                            {t('anxiety')} {session.analysis.anxietyLevel}/10
                          </span>
                        )}
                      {session.status === SessionStatus.Completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/dashboard/chat/${session.id}/analysis`);
                          }}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(e, session.id)}
                        disabled={deletingId === session.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
