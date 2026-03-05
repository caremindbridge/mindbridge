'use client';

import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';

export function FeaturesSection() {
  const t = useTranslations('landing.features');
  const ref = useFadeIn<HTMLElement>();

  const features = [
    { icon: t('f1Icon'), title: t('f1Title'), desc: t('f1Desc') },
    { icon: t('f2Icon'), title: t('f2Title'), desc: t('f2Desc') },
    { icon: t('f3Icon'), title: t('f3Title'), desc: t('f3Desc') },
    { icon: t('f4Icon'), title: t('f4Title'), desc: t('f4Desc') },
  ];

  return (
    <section id="features" ref={ref} className="fade-section px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-14 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border/50 bg-card p-6 shadow-soft transition-shadow hover:shadow-soft-md"
            >
              <div className="mb-4 text-3xl">{f.icon}</div>
              <p className="mb-2 font-semibold text-foreground">{f.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
