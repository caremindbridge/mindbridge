'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useUsageStatus } from '@/entities/subscription';
import { useUser } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui';

type BannerType = 'payment' | 'trial' | 'low';

export function SubscriptionBanner() {
  const { user } = useUser();
  const { data: usage } = useUsageStatus();
  const t = useTranslations('subscription');
  const [dismissed, setDismissed] = useState<BannerType | null>(null);

  if (!user || user.role === UserRole.THERAPIST || !usage) return null;

  let type: BannerType | null = null;
  let message = '';
  let actionLabel = '';
  let actionHref = '';

  if (usage.paymentWarning) {
    type = 'payment';
    message = t('paymentFailed');
    actionLabel = t('updateCard');
    actionHref = '/dashboard/settings';
  } else if (
    usage.status === 'trial' &&
    usage.trialDaysLeft !== null &&
    usage.trialDaysLeft !== undefined &&
    usage.trialDaysLeft <= 2
  ) {
    type = 'trial';
    message = t('trialEndingSoon', { days: usage.trialDaysLeft });
    actionLabel = t('choosePlan');
    actionHref = '/pricing';
  } else if (usage.monthly && usage.monthly.limit > 0) {
    const pct = usage.monthly.totalRemaining / usage.monthly.limit;
    if (pct <= 0.2) {
      type = 'low';
      message = t('lowMessages');
      actionLabel = t('getMore');
      actionHref = '/pricing';
    }
  }

  if (!type || dismissed === type) return null;

  const isPayment = type === 'payment';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-3 px-4 py-2 text-sm',
        isPayment ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-800',
      )}
    >
      {isPayment ? (
        <AlertCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      {actionHref && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className={cn(
            'h-7 text-xs',
            isPayment && 'border-destructive text-destructive hover:bg-destructive/10',
          )}
        >
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      <button onClick={() => setDismissed(type!)} className="ml-1 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
