'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { toast } from 'sonner';

import { useUsageStatus } from '@/entities/subscription';
import { createPortal } from '@/shared/api/client';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export function SubscriptionSection() {
  const { data: usage } = useUsageStatus();
  const t = useTranslations('settings');

  if (!usage?.hasSubscription) return null;

  const handleManage = async () => {
    try {
      const { url } = await createPortal();
      if (url) window.location.href = url;
      else toast.info('Coming soon');
    } catch {
      toast.error('Failed to open billing portal');
    }
  };

  const statusBadgeVariant =
    usage.status === 'active' ? 'default' : usage.status === 'trial' ? 'secondary' : 'destructive';

  const renewalText =
    usage.status === 'trial'
      ? `Trial — ${usage.trialDaysLeft ?? 0} days left`
      : usage.periodEnd
        ? `Renews ${new Date(usage.periodEnd).toLocaleDateString()}`
        : '';

  const showMonthlyStats = (usage.monthly?.limit ?? 0) > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('subscription')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium capitalize">{usage.plan} Plan</div>
            <div className="text-xs text-muted-foreground">{renewalText}</div>
          </div>
          <Badge variant={statusBadgeVariant}>{usage.status}</Badge>
        </div>

        {showMonthlyStats && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Messages used</span>
              <span>
                {usage.monthly?.used}/{usage.monthly?.limit}
              </span>
            </div>
            {(usage.monthly?.bonusRemaining ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bonus messages</span>
                <span>{usage.monthly?.bonusRemaining}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">
              {usage.status === 'trial' ? 'Choose Plan' : 'Change Plan'}
            </Link>
          </Button>
          {usage.status === 'active' && (
            <Button variant="ghost" size="sm" onClick={handleManage}>
              Manage Billing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
