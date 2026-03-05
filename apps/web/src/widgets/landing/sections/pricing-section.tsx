'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';
import { Button } from '@/shared/ui/button';

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  const ref = useFadeIn<HTMLElement>();

  const plans = [
    {
      title: t('freeTitle'),
      price: t('freePrice'),
      period: t('freePeriod'),
      features: [t('freeF1'), t('freeF2'), t('freeF3')],
      cta: t('freeCta'),
      href: '/register',
      highlight: false,
    },
    {
      title: t('proTitle'),
      price: t('proPrice'),
      period: t('proPeriod'),
      features: [t('proF1'), t('proF2'), t('proF3'), t('proF4')],
      cta: t('proCta'),
      href: '/register',
      highlight: true,
    },
  ];

  return (
    <section id="pricing" ref={ref} className="fade-section px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-14 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h2>

        <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className={`rounded-xl border p-6 ${
                plan.highlight
                  ? 'border-primary/40 bg-primary/5 shadow-soft-md'
                  : 'border-border/50 bg-card shadow-soft'
              }`}
            >
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

        <p className="mt-6 text-sm text-muted-foreground">{t('note')}</p>
      </div>
    </section>
  );
}
