'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  const ref = useFadeIn<HTMLElement>();

  const plans = [
    {
      title: t('liteTitle'),
      price: t('litePrice'),
      period: t('litePeriod'),
      features: [t('liteF1'), t('liteF2'), t('liteF3'), t('liteF4')],
      cta: t('liteCta'),
      href: '/register',
      highlight: false,
      popular: false,
    },
    {
      title: t('standardTitle'),
      price: t('standardPrice'),
      period: t('standardPeriod'),
      features: [t('standardF1'), t('standardF2'), t('standardF3'), t('standardF4')],
      cta: t('standardCta'),
      href: '/register',
      highlight: true,
      popular: true,
    },
    {
      title: t('premiumTitle'),
      price: t('premiumPrice'),
      period: t('premiumPeriod'),
      features: [t('premiumF1'), t('premiumF2'), t('premiumF3'), t('premiumF4')],
      cta: t('premiumCta'),
      href: '/register',
      highlight: false,
      popular: false,
    },
  ];

  return (
    <section id="pricing" ref={ref} className="fade-section px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-14 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className={`relative rounded-xl border p-6 ${
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

              <ul className="mb-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button asChild variant={plan.highlight ? 'default' : 'outline'} className="w-full">
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t('note')}</p>
          <Link
            href="/pricing"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('viewAllPlans')}
          </Link>
        </div>
      </div>
    </section>
  );
}
