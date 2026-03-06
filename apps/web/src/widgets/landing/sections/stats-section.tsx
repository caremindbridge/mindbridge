'use client';

import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';

export function StatsSection() {
  const t = useTranslations('landing.stats');
  const ref = useFadeIn<HTMLElement>();

  const stats = [
    { value: t('value1'), label: t('label1') },
    { value: t('value2'), label: t('label2') },
    { value: t('value3'), label: t('label3') },
  ];

  return (
    <section ref={ref} className="fade-section border-y border-border/50 bg-muted/30 px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {stats.map((s) => (
            <div key={s.value} className="space-y-2 text-center">
              <p className="font-serif text-3xl font-medium text-primary md:text-5xl">{s.value}</p>
              <p className="text-xs text-muted-foreground md:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-base font-medium text-foreground/80">{t('note')}</p>
      </div>
    </section>
  );
}
