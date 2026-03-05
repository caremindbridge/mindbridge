'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';
import { Button } from '@/shared/ui/button';

export function TherapistSection() {
  const t = useTranslations('landing.therapists');
  const ref = useFadeIn<HTMLElement>();

  const bullets = [t('b1'), t('b2'), t('b3'), t('b4')];

  const plans = [
    {
      name: t('t1Name'),
      price: t('t1Price'),
      desc: t('t1Desc'),
      features: [t('t1F1'), t('t1F2'), t('t1F3')],
      cta: t('t1Cta'),
      href: '/register?role=therapist',
      highlight: false,
    },
    {
      name: t('t2Name'),
      price: t('t2Price'),
      period: t('t2Period'),
      desc: t('t2Desc'),
      features: [t('t2F1'), t('t2F2'), t('t2F3'), t('t2F4')],
      cta: t('t2Cta'),
      href: '/register?role=therapist',
      highlight: true,
    },
    {
      name: t('t3Name'),
      price: t('t3Price'),
      desc: t('t3Desc'),
      features: [t('t3F1'), t('t3F2'), t('t3F3'), t('t3F4')],
      cta: t('t3Cta'),
      href: 'mailto:hello@mindbridge.app',
      highlight: false,
    },
  ];

  return (
    <section
      id={t('id')}
      ref={ref}
      className="fade-section border-t border-border/50 bg-muted/20 px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              {t('title')}
            </p>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
              {t('subtitle')}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">{t('body')}</p>
          </div>

          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-foreground/80">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mb-8 text-xl font-semibold text-foreground">{t('pricingTitle')}</h3>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 ${
                plan.highlight
                  ? 'border-primary/40 bg-primary/5 shadow-soft-md'
                  : 'border-border/50 bg-card shadow-soft'
              }`}
            >
              <p className="mb-1 font-semibold text-foreground">{plan.name}</p>
              <div className="mb-1 flex items-baseline gap-0.5">
                <span className="font-serif text-3xl font-medium text-foreground">{plan.price}</span>
                {'period' in plan && plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="mb-5 text-sm text-muted-foreground">{plan.desc}</p>

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
      </div>
    </section>
  );
}
