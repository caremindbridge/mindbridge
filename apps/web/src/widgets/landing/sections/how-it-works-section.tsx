'use client';

import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');
  const ref = useFadeIn<HTMLElement>();

  const steps = [
    { icon: t('step1Icon'), title: t('step1Title'), desc: t('step1Desc') },
    { icon: t('step2Icon'), title: t('step2Title'), desc: t('step2Desc') },
    { icon: t('step3Icon'), title: t('step3Title'), desc: t('step3Desc') },
  ];

  return (
    <section ref={ref} className="fade-section bg-muted/20 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-14 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h2>

        <div className="grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="relative space-y-4">
              {i < steps.length - 1 && (
                <div className="absolute left-6 top-10 hidden h-px w-full border-t border-dashed border-border/60 md:block" />
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                {step.icon}
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">{step.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
