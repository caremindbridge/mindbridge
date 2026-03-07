'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  const tp = useTranslations('pricing');
  const ref = useFadeIn<HTMLElement>();

  const plans = [
    {
      id: 'lite',
      title: t('liteTitle'),
      price: t('litePrice'),
      period: t('litePeriod'),
      highlight: false,
      popular: false,
    },
    {
      id: 'standard',
      title: t('standardTitle'),
      price: t('standardPrice'),
      period: t('standardPeriod'),
      highlight: true,
      popular: true,
    },
    {
      id: 'premium',
      title: t('premiumTitle'),
      price: t('premiumPrice'),
      period: t('premiumPeriod'),
      highlight: false,
      popular: false,
    },
  ];

  return (
    <section id="pricing" ref={ref} className="fade-section px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 font-serif text-2xl font-medium tracking-tight text-foreground md:mb-14 md:text-3xl lg:text-4xl">
          {t('title')}
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const features = tp.raw(`planFeatures.${plan.id}`) as string[];
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  plan.highlight
                    ? 'border-primary/40 bg-primary/5 shadow-soft-md'
                    : 'border-border/50 bg-card shadow-soft'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>{t('popular')}</Badge>
                  </div>
                )}
                <p className="mb-1 font-semibold text-foreground">{plan.title}</p>
                <div className="mb-5 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-medium text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="mb-6 flex-1 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button asChild variant={plan.highlight ? 'default' : 'outline'} className="w-full">
                  <Link href="/login">{tp('choosePlan')}</Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t('note')}</p>
          <p className="text-sm text-muted-foreground">
            {t('therapistLink')}{' '}
            <Link
              href="/pricing?role=therapist"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('therapistLinkCta')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
