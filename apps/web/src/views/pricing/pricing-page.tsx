'use client';

import type { UserDto } from '@mindbridge/types/src/user';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { toast } from 'sonner';

import { useUsageStatus } from '@/entities/subscription';
import { useUser } from '@/entities/user';
import { createCheckout, createPackCheckout } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';

interface PatientPlan {
  id: string;
  name: string;
  price: number;
  monthlyMessageLimit: number;
  sessionMessageLimit: number;
  features: string[];
  popular?: boolean;
}

interface TherapistPlan {
  id: string;
  name: string;
  price?: number;
  pricePerSeat?: number;
  patientLimit: number;
  reportLimit: number;
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
}

// Static plan data — mirrors backend plans controller
const PLANS: PlansData = {
  patient: [
    {
      id: 'lite',
      name: 'Lite',
      price: 999,
      monthlyMessageLimit: 200,
      sessionMessageLimit: 30,
      features: ['200 messages/month', '30 per session', 'Full dashboard', 'AI analysis', 'Therapist connection'],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 1999,
      monthlyMessageLimit: 500,
      sessionMessageLimit: 50,
      features: ['500 messages/month', '50 per session', 'Full dashboard', 'AI analysis', 'Therapist connection'],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 3999,
      monthlyMessageLimit: 1500,
      sessionMessageLimit: 80,
      features: ['1,500 messages/month', '80 per session', 'Full dashboard', 'AI analysis', 'Therapist connection', 'Priority responses'],
    },
  ],
  therapist: [
    {
      id: 'therapist_solo',
      name: 'Solo',
      price: 2900,
      patientLimit: 10,
      reportLimit: 10,
      features: ['10 patients', '10 AI reports/month', 'Patient dossiers', 'Mira instructions'],
    },
    {
      id: 'therapist_practice',
      name: 'Practice',
      price: 5900,
      patientLimit: 30,
      reportLimit: -1,
      features: ['30 patients', 'Unlimited reports', 'Patient dossiers', 'Mira instructions'],
      popular: true,
    },
    {
      id: 'therapist_clinic',
      name: 'Clinic',
      pricePerSeat: 3900,
      patientLimit: -1,
      reportLimit: -1,
      features: ['Unlimited patients', 'Unlimited reports', 'Leadership dashboard', 'Custom branding'],
    },
  ],
  messagePacks: [
    { id: 'pack_50', messages: 50, price: 299 },
    { id: 'pack_150', messages: 150, price: 699, popular: true },
    { id: 'pack_400', messages: 400, price: 1499, bestValue: true },
  ],
};

function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function PricingPage() {
  const t = useTranslations('pricing');
  const { user } = useUser();
  const { data: usage } = useUsageStatus();

  const currentPlan = usage?.plan;

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      window.location.href = '/register';
      return;
    }
    try {
      const { url } = await createCheckout(planId);
      if (url) window.location.href = url;
      else toast.info(t('comingSoon'));
    } catch {
      toast.error(t('checkoutError'));
    }
  };

  const handleBuyPack = async (packId: string) => {
    if (!user) {
      window.location.href = '/register';
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
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Tabs defaultValue="patient" className="space-y-8">
          <TabsList className="mx-auto grid w-64 grid-cols-2">
            <TabsTrigger value="patient">{t('forMe')}</TabsTrigger>
            <TabsTrigger value="therapist">{t('forTherapists')}</TabsTrigger>
          </TabsList>

          {/* Patient plans */}
          <TabsContent value="patient" className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.patient.map((plan) => (
                <PlanCard
                  key={plan.id}
                  name={plan.name}
                  price={formatPrice(plan.price)}
                  period="/mo"
                  features={plan.features}
                  popular={plan.popular}
                  isCurrent={currentPlan === plan.id}
                  isClinic={false}
                  onSelect={() => handleSelectPlan(plan.id)}
                />
              ))}
            </div>

            {/* Message packs */}
            <div>
              <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">
                {t('messagePacks')}
              </h3>
              <div className="mx-auto grid max-w-lg grid-cols-3 gap-3">
                {PLANS.messagePacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handleBuyPack(pack.id)}
                    className="rounded-xl border p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="text-lg font-bold">{pack.messages}</div>
                    <div className="text-xs text-muted-foreground">{t('messages')}</div>
                    <div className="mt-1 text-sm font-semibold">{formatPrice(pack.price)}</div>
                    {pack.popular && <Badge className="mt-1 text-[10px]">{t('popular')}</Badge>}
                    {pack.bestValue && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        Best Value
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {t('packsNeverExpire')}
              </p>
            </div>
          </TabsContent>

          {/* Therapist plans */}
          <TabsContent value="therapist" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.therapist.map((plan) => (
                <PlanCard
                  key={plan.id}
                  name={plan.name}
                  price={plan.pricePerSeat ? formatPrice(plan.pricePerSeat) : formatPrice(plan.price ?? 0)}
                  period={plan.pricePerSeat ? '/seat/mo' : '/mo'}
                  features={plan.features}
                  popular={plan.popular}
                  isCurrent={currentPlan === plan.id}
                  isClinic={plan.id === 'therapist_clinic'}
                  onSelect={() =>
                    plan.id === 'therapist_clinic'
                      ? window.open('mailto:hello@mindbridge.app?subject=Clinic%20Plan', '_blank')
                      : handleSelectPlan(plan.id)
                  }
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">{t('patientsGetStandard')}</p>
          </TabsContent>
        </Tabs>

        <FAQ />
      </div>
    </div>
  );
}

function PricingHeader({ user }: { user: UserDto | null }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          MindBridge
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Button size="sm" asChild>
              <Link href={user.role === 'therapist' ? '/dashboard/therapist' : '/dashboard'}>
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

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  isCurrent: boolean;
  isClinic: boolean;
  onSelect: () => void;
}

function PlanCard({ name, price, period, features, popular, isCurrent, isClinic, onSelect }: PlanCardProps) {
  const t = useTranslations('pricing');

  return (
    <Card className={cn('relative', popular && 'border-primary shadow-md')}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>{t('popular')}</Badge>
        </div>
      )}
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-lg">{name}</CardTitle>
        <div className="mt-1">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
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
          variant={popular ? 'default' : 'outline'}
          disabled={isCurrent}
          onClick={onSelect}
        >
          {isCurrent ? t('currentPlan') : isClinic ? t('contactUs') : t('choosePlan')}
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
