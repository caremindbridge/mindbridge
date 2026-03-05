'use client';

import { SessionStatus } from '@mindbridge/types/src/chat';
import { format } from 'date-fns';
import { BarChart3, MessageCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

const statusLabels: Record<string, string> = {
  [SessionStatus.Active]: 'Active',
  [SessionStatus.Ended]: 'Ended',
  [SessionStatus.Analyzing]: 'Analyzing...',
  [SessionStatus.Completed]: 'Completed',
};


export function ChatSessionsPage() {
  const { data, isLoading, mutate } = useSessions();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      mutate();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CBT Sessions</h1>
          <p className="text-muted-foreground">
            Your cognitive behavioral therapy conversations
          </p>
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
            <h3 className="mb-2 text-lg font-medium">No sessions yet</h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              Start a new CBT session to begin working through your thoughts with AI guidance.
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
                        CBT Session · {format(new Date(session.createdAt), 'MMM d, yyyy')}
                      </CardTitle>
                      <CardDescription>{format(new Date(session.createdAt), 'HH:mm')}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[session.status]}>
                        {statusLabels[session.status]}
                      </Badge>
                      {session.status === SessionStatus.Analyzing && (
                        <span className="h-4 w-16 animate-pulse rounded bg-muted" />
                      )}
                      {session.status === SessionStatus.Completed &&
                        session.analysis?.anxietyLevel != null && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${anxietyBadgeClass(session.analysis.anxietyLevel)}`}
                          >
                            Anxiety {session.analysis.anxietyLevel}/10
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
