'use client';

import type { UserDto } from '@mindbridge/types/src/user';
import { Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { usePlans, useUsageStatus } from '@/entities/subscription';
import { useUser } from '@/entities/user';
import { createCheckout, createPackCheckout } from '@/shared/api/client';
import { siteConfig } from '@/shared/lib/site-config';
import { cn } from '@/shared/lib/utils';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Logo } from '@/shared/ui';

interface PatientPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
}

interface TherapistPlan {
  id: string;
  name: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPricePerSeat?: number;
  features: string[];
  popular?: boolean;
}

interface MessagePack {
  id: string;
  messages: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

interface PlansData {
  patient: PatientPlan[];
  therapist: TherapistPlan[];
  messagePacks: MessagePack[];
  yearlyDiscountPercent: number;
}

const STATIC_PLANS: PlansData = {
  patient: [
    {
      id: 'lite',
      name: 'Lite',
      monthlyPrice: 999,
      yearlyPrice: 7990,
      features: ['200 messages/month', '30 per session', 'Mood tracking', 'Session analysis'],
    },
    {
      id: 'standard',
      name: 'Standard',
      monthlyPrice: 1999,
      yearlyPrice: 15990,
      features: ['500 messages/month', '50 per session', 'Mood tracking', 'Session analysis', 'Detailed analytics', 'Therapist connection'],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: 3999,
      yearlyPrice: 31990,
      features: ['1,500 messages/month', '80 per session', 'Mood tracking', 'Session analysis', 'Detailed analytics', 'Therapist connection', 'Cross-session memory', 'Export chat history'],
    },
  ],
  therapist: [
    {
      id: 'therapist_solo',
      name: 'Solo',
      monthlyPrice: 2900,
      yearlyPrice: 23200,
      features: ['10 patients', '10 AI reports/month', 'Patient dossiers', 'Mira instructions'],
    },
    {
      id: 'therapist_practice',
      name: 'Practice',
      monthlyPrice: 5900,
      yearlyPrice: 47200,
      features: ['30 patients', 'Unlimited reports', 'Patient dossiers', 'Mira instructions'],
      popular: true,
    },
    {
      id: 'therapist_clinic',
      name: 'Clinic',
      monthlyPricePerSeat: 3900,
      features: ['Unlimited patients', 'Unlimited reports', 'Leadership dashboard', 'Custom branding'],
    },
  ],
  messagePacks: [
    { id: 'pack_50', messages: 50, price: 299 },
    { id: 'pack_150', messages: 150, price: 699, popular: true },
    { id: 'pack_400', messages: 400, price: 1499, bestValue: true },
  ],
  yearlyDiscountPercent: 33,
};

const RUB_PRICE_MAP: Record<number, number> = {
  999: 899,
  7990: 7190,
  1999: 1799,
  15990: 14390,
  3999: 3599,
  31990: 28790,
  2900: 2600,
  23200: 20800,
  5900: 5300,
  47200: 42400,
  3900: 3500,
  299: 269,
  699: 629,
  1499: 1349,
};

function formatPrice(cents: number): string {
  if (siteConfig.isRussia) {
    const rub = RUB_PRICE_MAP[cents] ?? Math.round(cents * 0.9);
    return `${rub} ₽`;
  }
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function PricingPage() {
  const t = useTranslations('pricing');
  const { user } = useUser();
  const { data: usage } = useUsageStatus();
  const { data: rawPlans } = usePlans();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showTherapist, setShowTherapist] = useState(false);

  const plans = (rawPlans as PlansData | undefined) ?? STATIC_PLANS;
  const currentPlan = (usage as { plan?: string } | undefined)?.plan;
  const isTrialUser = !currentPlan || currentPlan === 'trial';

  const isTherapist = user
    ? (user.activeMode ?? user.role) === 'therapist'
    : showTherapist;

  const handleSelectPlan = async (planId: string) => {
    if (!siteConfig.canPay) {
      toast.info(t('comingSoon'));
      return;
    }
    if (planId === 'therapist_clinic') {
      window.open('mailto:hello@mindbridge.app?subject=Clinic%20Plan', '_blank');
      return;
    }
    if (!user) {
      window.location.href = '/register';
      return;
    }
    try {
      const { url } = await createCheckout(planId, billingCycle);
      if (url) window.location.href = url;
      else toast.info(t('comingSoon'));
    } catch {
      toast.error(t('checkoutError'));
    }
  };

  const handleBuyPack = async (packId: string) => {
    if (!siteConfig.canPay) {
      toast.info(t('comingSoon'));
      return;
    }
    if (!user) {
      window.location.href = '/register';
      return;
    }
    if (isTrialUser) {
      toast.info(t('packsRequirePlan'));
      return;
    }
    try {
      const { url } = await createPackCheckout(packId);
      if (url) window.location.href = url;
      else toast.info(t('comingSoon'));
    } catch {
      toast.error(t('checkoutError'));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PricingHeader user={user} />

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {isTherapist ? t('titleTherapist') : t('titlePatient')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isTherapist ? t('subtitleTherapist') : t('subtitlePatient')}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'text-sm',
                billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {t('monthly')}
            </span>
            <button
              aria-label="Toggle billing cycle"
              onClick={() => setBillingCycle((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
              className={cn(
                'relative h-6 w-11 flex-shrink-0 rounded-full transition-colors overflow-hidden',
                billingCycle === 'yearly' ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  billingCycle === 'yearly' ? 'translate-x-[20px]' : 'translate-x-0',
                )}
              />
            </button>
            <span
              className={cn(
                'text-sm',
                billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {t('yearly')}
            </span>
          </div>
          <div className={cn('transition-opacity', billingCycle !== 'yearly' && 'invisible')}>
            <Badge
              variant="secondary"
              className="whitespace-nowrap border-emerald-200 bg-emerald-50 text-xs text-emerald-700"
            >
              {t('save33')}
            </Badge>
          </div>
        </div>

        {/* Trial banner — patients only, unauthenticated or on trial */}
        {!isTherapist && (!user || (usage as { status?: string } | undefined)?.status === 'trial') && (
          <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm">
            <span className="font-semibold text-primary">{t('trialBadge')}</span>
            <span className="text-muted-foreground">{t('trialDescription')}</span>
          </div>
        )}

        {/* Plan cards */}
        {isTherapist ? (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.therapist.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                isCurrent={currentPlan === plan.id}
                isClinic={plan.id === 'therapist_clinic'}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.patient.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  isCurrent={currentPlan === plan.id}
                  isClinic={false}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>

            {/* Message packs — patients only */}
            <div className="mt-10">
              <h3 className="mb-1 text-center text-sm font-medium text-muted-foreground">
                {t('messagePacks')}
              </h3>
              {isTrialUser && (
                <p className="mb-4 text-center text-xs text-muted-foreground/70">
                  {t('packsRequirePlan')}
                </p>
              )}
              {!isTrialUser && <div className="mb-4" />}
              <div className="mx-auto grid max-w-lg grid-cols-3 gap-3">
                {plans.messagePacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handleBuyPack(pack.id)}
                    className={cn(
                      'relative rounded-xl border p-3 text-center transition-all',
                      isTrialUser
                        ? 'cursor-not-allowed opacity-40'
                        : 'hover:border-primary/50 hover:bg-primary/5',
                    )}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        {t('popular')}
                      </span>
                    )}
                    {pack.bestValue && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        Best Value
                      </span>
                    )}
                    <div className="text-lg font-bold">{pack.messages}</div>
                    <div className="text-xs text-muted-foreground">{t('messages')}</div>
                    <div className="mt-1 text-sm font-semibold">{formatPrice(pack.price)}</div>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {t('packsNeverExpire')}
              </p>
            </div>
          </>
        )}

        {/* Role switcher for unauthenticated users */}
        {!user && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setShowTherapist((s) => !s)}
              className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              {isTherapist ? t('areYouPatient') : t('areYouTherapist')}
            </button>
          </div>
        )}

        <FAQ />
      </div>
    </div>
  );
}

function PricingHeader({ user }: { user: UserDto | null }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/">
          <Logo size="default" />
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Button size="sm" asChild>
              <Link href={user.activeMode === 'therapist' ? '/dashboard/therapist' : '/dashboard'}>
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

interface PlanData {
  id: string;
  name: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPricePerSeat?: number;
  features: string[];
  popular?: boolean;
}

interface PlanCardProps {
  plan: PlanData;
  billingCycle: 'monthly' | 'yearly';
  isCurrent: boolean;
  isClinic: boolean;
  onSelect: (planId: string) => void;
}

const PATIENT_PLAN_IDS = ['lite', 'standard', 'premium'];

function PlanCard({ plan, billingCycle, isCurrent, isClinic, onSelect }: PlanCardProps) {
  const t = useTranslations('pricing');

  const features = PATIENT_PLAN_IDS.includes(plan.id)
    ? (t.raw(`planFeatures.${plan.id}`) as string[])
    : plan.features;

  const monthlyPrice = plan.monthlyPrice ?? 0;
  const yearlyPrice = plan.yearlyPrice ?? 0;
  const monthlyIfYearly = yearlyPrice > 0 ? Math.round(yearlyPrice / 12) : 0;
  const savedPerYear = monthlyPrice * 12 - yearlyPrice;
  const showYearly = billingCycle === 'yearly' && yearlyPrice > 0 && !plan.monthlyPricePerSeat;

  return (
    <Card className={cn('relative', plan.popular && 'border-primary shadow-md')}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>{t('popular')}</Badge>
        </div>
      )}
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <div className="mt-2">
          {plan.monthlyPricePerSeat ? (
            <>
              <span className="text-3xl font-bold">
                {formatPrice(plan.monthlyPricePerSeat)}
              </span>
              <span className="text-sm text-muted-foreground">{t('perSeatPerMonth')}</span>
            </>
          ) : showYearly ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(monthlyPrice)}
                </span>
                <span className="text-3xl font-bold">{formatPrice(monthlyIfYearly)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{t('billedYearly')}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">
                {formatPrice(yearlyPrice)}/{t('yearShort')} — save {formatPrice(savedPerYear)}
              </div>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold">{formatPrice(monthlyPrice)}</span>
              <span className="text-sm text-muted-foreground">{t('perMonth')}</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          variant={plan.popular ? 'default' : 'outline'}
          disabled={isCurrent || (!siteConfig.canPay && !isClinic)}
          onClick={() => onSelect(plan.id)}
        >
          {isCurrent
            ? t('currentPlan')
            : isClinic
              ? t('contactUs')
              : !siteConfig.canPay
                ? t('paymentComingSoon')
                : t('choosePlan')}
        </Button>
      </CardContent>
    </Card>
  );
}

function FAQ() {
  const t = useTranslations('pricing');

  const items = [
    { q: t('faqMessageQ'), a: t('faqMessageA') },
    { q: t('faqChangePlanQ'), a: t('faqChangePlanA') },
    { q: t('faqRunOutQ'), a: t('faqRunOutA') },
    { q: t('faqPacksExpireQ'), a: t('faqPacksExpireA') },
    { q: t('faqSecurityQ'), a: t('faqSecurityA') },
  ];

  return (
    <div className="mx-auto mt-16 max-w-2xl">
      <h2 className="mb-6 text-center text-xl font-semibold">{t('faq')}</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <details key={i} className="group rounded-lg border">
            <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium">
              {item.q}
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
