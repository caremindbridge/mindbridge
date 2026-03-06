'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useDisconnectFromTherapist, useMyTherapist } from '@/entities/therapist';
import { AcceptInviteDialog } from '@/features/therapist';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/ui';

export function TherapistConnectionSection() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { data: therapist, isLoading } = useMyTherapist();
  const disconnect = useDisconnectFromTherapist();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      setConfirmOpen(false);
      toast.success(t('disconnectedSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('therapistConnection')}
          </p>
          <div className="divide-y divide-border/50">
            {isLoading ? (
              <div className="px-5 py-4">
                <Skeleton className="h-9 w-full" />
              </div>
            ) : therapist ? (
              <>
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">
                      {t('connectedTo', { name: (therapist as { email: string }).email })}
                    </p>
                    {(therapist as { connectedAt?: string }).connectedAt && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('since', {
                          date: format(
                            new Date((therapist as { connectedAt: string }).connectedAt),
                            'MMMM yyyy',
                          ),
                        })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  >
                    {t('disconnect')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-sm text-muted-foreground">{t('notConnected')}</p>
                <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                  {t('enterInviteCode')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AcceptInviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('disconnect')}</DialogTitle>
            <DialogDescription>{t('disconnectConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnect.isPending}
            >
              {t('disconnect')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
