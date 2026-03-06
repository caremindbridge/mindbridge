'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useUsageStatus } from '@/entities/subscription';
import { cn } from '@/shared/lib/utils';

export function UsageBar() {
  const { data: usage } = useUsageStatus();
  const t = useTranslations('subscription');

  if (!usage?.hasSubscription || !usage.monthly) return null;

  const { monthly, status, trialDaysLeft } = usage;
  const pct = Math.round((monthly.used / monthly.limit) * 100);
  const isLow = monthly.totalRemaining <= Math.round(monthly.limit * 0.2);
  const isZero = monthly.totalRemaining <= 0;

  return (
    <div className="mx-3 mb-2 rounded-lg border border-sidebar-border p-3">
      {status === 'trial' && trialDaysLeft != null && (
        <div className="mb-2 text-xs text-muted-foreground">
          {t('trialDaysLeft', { days: trialDaysLeft })}
        </div>
      )}

      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('messages')}</span>
        <span
          className={cn(
            'font-medium',
            isZero ? 'text-destructive' : isLow ? 'text-amber-600' : 'text-foreground',
          )}
        >
          {monthly.totalRemaining}/{monthly.limit}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isZero ? 'bg-destructive' : isLow ? 'bg-amber-500' : 'bg-primary',
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      {monthly.bonusRemaining > 0 && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          +{monthly.bonusRemaining} {t('bonusMessages')}
        </div>
      )}

      {isLow && (
        <Link href="/pricing" className="mt-2 block text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
          {t('getMore')}
        </Link>
      )}
    </div>
  );
}
