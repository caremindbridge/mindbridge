'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { format } from 'date-fns';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useUsageStatus } from '@/entities/subscription';
import { usePatients } from '@/entities/therapist';
import { useUser } from '@/entities/user';
import { createPortal } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import { Badge, Button, Card, CardContent } from '@/shared/ui';

const PLAN_NAMES: Record<string, string> = {
  trial: 'Trial',
  lite: 'Lite',
  standard: 'Standard',
  premium: 'Premium',
  therapist_trial: 'Trial',
  therapist_solo: 'Solo',
  therapist_practice: 'Practice',
  therapist_clinic: 'Clinic',
};

function formatPlanName(plan: string): string {
  return PLAN_NAMES[plan] ?? plan;
}

function statusVariant(status?: string) {
  if (status === 'active') return 'default';
  if (status === 'trial') return 'secondary';
  return 'destructive';
}

export function SubscriptionSection() {
  const ts = useTranslations('settings');
  const tsub = useTranslations('subscription');
  const { user } = useUser();
  const isTherapist = user?.role === UserRole.THERAPIST;
  const { data: patients } = usePatients();

  // Therapists: fetch their therapist plan explicitly; for patients this returns hasSubscription:false
  const { data: therapistUsage } = useUsageStatus(undefined, 'therapist');
  // Therapists: also fetch their patient plan (created on first switch to personal mode)
  // Non-therapists: fetch their patient plan via default (no planType)
  const { data: patientUsage } = useUsageStatus(undefined, isTherapist ? 'patient' : undefined);

  const primaryUsage = isTherapist ? therapistUsage : patientUsage;

  if (!primaryUsage?.hasSubscription) return null;

  const handleManage = async () => {
    try {
      const { url } = await createPortal();
      if (url) window.location.href = url;
      else toast.info(ts('comingSoon'));
    } catch {
      toast.error(ts('billingPortalError'));
    }
  };

  const activePatients = patients?.filter((p) => p.linkStatus === 'active').length ?? 0;
  const patientLimitLabel =
    therapistUsage?.patientLimit === -1 ? ts('unlimited') : String(therapistUsage?.patientLimit ?? '—');

  const therapistRenewal =
    therapistUsage?.status === 'trial'
      ? tsub('trialDaysLeft', { days: therapistUsage.trialDaysLeft ?? 0 })
      : therapistUsage?.periodEnd
        ? ts('renewsOn', { date: format(new Date(therapistUsage.periodEnd), 'MMM d, yyyy') })
        : '';

  const patientRenewal =
    patientUsage?.status === 'trial'
      ? tsub('trialDaysLeft', { days: patientUsage.trialDaysLeft ?? 0 })
      : patientUsage?.periodEnd
        ? ts('renewsOn', { date: format(new Date(patientUsage.periodEnd), 'MMM d, yyyy') })
        : '';

  if (!isTherapist) {
    // Non-therapist: single patient plan card
    const usage = patientUsage!;
    const showMonthly = (usage.monthly?.limit ?? 0) > 0;
    return (
      <Card>
        <CardContent className="p-0">
          <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {ts('subscription')}
          </p>
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium">{formatPlanName(usage.plan ?? '')} {ts('plan')}</p>
                {patientRenewal && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{patientRenewal}</p>
                )}
              </div>
              <Badge variant={statusVariant(usage.status)} className="capitalize">
                {usage.status}
              </Badge>
            </div>
            {showMonthly && (
              <div className="space-y-1 px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ts('messagesUsed')}</span>
                  <span>{usage.monthly?.used} / {usage.monthly?.limit}</span>
                </div>
                {(usage.monthly?.bonusRemaining ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{ts('bonusMessages')}</span>
                    <span>+{usage.monthly?.bonusRemaining}</span>
                  </div>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, Math.round(((usage.monthly?.used ?? 0) / (usage.monthly?.limit ?? 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-2 px-5 py-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/pricing">
                  {usage.status === 'trial' ? ts('choosePlan') : ts('changePlan')}
                </Link>
              </Button>
              {usage.status === 'active' && (
                <Button variant="ghost" size="sm" onClick={handleManage}>
                  {ts('manageBilling')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Therapist: practice plan + personal plan (if exists)
  const showPersonal = patientUsage?.hasSubscription;
  const personalUsage = patientUsage!;

  return (
    <Card>
      <CardContent className="p-0">
        {/* Practice plan */}
        <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {ts('practice')}
        </p>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium">{formatPlanName(therapistUsage!.plan ?? '')} {ts('plan')}</p>
              {therapistRenewal && (
                <p className="mt-0.5 text-xs text-muted-foreground">{therapistRenewal}</p>
              )}
            </div>
            <Badge variant={statusVariant(therapistUsage!.status)} className="capitalize">
              {therapistUsage!.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium">{ts('activePatients', { count: activePatients })}</p>
            <p className={cn(
              'text-sm',
              activePatients >= Number(therapistUsage!.patientLimit ?? Infinity) && therapistUsage!.patientLimit !== -1
                ? 'text-amber-600'
                : 'text-muted-foreground',
            )}>
              {activePatients} / {patientLimitLabel}
            </p>
          </div>
          <div className="flex gap-2 px-5 py-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">
                {therapistUsage!.status === 'trial' ? ts('choosePlan') : ts('changePlan')}
              </Link>
            </Button>
            {therapistUsage!.status === 'active' && (
              <Button variant="ghost" size="sm" onClick={handleManage}>
                {ts('manageBilling')}
              </Button>
            )}
          </div>
        </div>

        {/* Personal plan (only if therapist has switched to patient mode at least once) */}
        {showPersonal && (
          <>
            <p className="border-t-2 border-border px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {ts('personalPlan')}
            </p>
            <div className="divide-y divide-border/50">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium">{formatPlanName(personalUsage.plan ?? '')} {ts('plan')}</p>
                  {patientRenewal && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{patientRenewal}</p>
                  )}
                </div>
                <Badge variant={statusVariant(personalUsage.status)} className="capitalize">
                  {personalUsage.status}
                </Badge>
              </div>
              {(personalUsage.monthly?.limit ?? 0) > 0 && (
                <div className="space-y-1 px-5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{ts('messagesUsed')}</span>
                    <span>{personalUsage.monthly?.used} / {personalUsage.monthly?.limit}</span>
                  </div>
                  {(personalUsage.monthly?.bonusRemaining ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{ts('bonusMessages')}</span>
                      <span>+{personalUsage.monthly?.bonusRemaining}</span>
                    </div>
                  )}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(((personalUsage.monthly?.used ?? 0) / (personalUsage.monthly?.limit ?? 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2 px-5 py-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/pricing">
                    {personalUsage.status === 'trial' ? ts('choosePlan') : ts('changePlan')}
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
