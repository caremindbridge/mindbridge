'use client';

import type { UsageStatus } from '@mindbridge/types/src/subscription';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button, Dialog, DialogContent, DialogTitle } from '@/shared/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  usage?: UsageStatus;
}

export function TrialEndedModal({ open, onClose, usage }: Props) {
  const t = useTranslations('subscription');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center">
        <div className="mb-3 text-4xl">🌿</div>
        <DialogTitle>{t('trialEndedTitle')}</DialogTitle>
        <p className="mb-4 text-sm text-muted-foreground">{t('trialEndedDescription')}</p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-lg font-semibold">{usage?.monthly?.used ?? 0}</div>
            <div className="text-xs text-muted-foreground">{t('messagesExchanged')}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-lg font-semibold">7</div>
            <div className="text-xs text-muted-foreground">{t('daysOfTrial')}</div>
          </div>
        </div>

        <Button className="w-full" asChild>
          <Link href="/pricing">{t('choosePlan')}</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
