'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';
import { Button } from '@/shared/ui/button';

export function CtaSection() {
  const t = useTranslations('landing.cta');
  const ref = useFadeIn<HTMLElement>();

  return (
    <section ref={ref} className="fade-section relative overflow-hidden px-4 py-20 md:px-6 md:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-3xl" />
      </div>

      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {t('title')}
        </h2>
        <p className="mb-8 text-base text-muted-foreground md:text-lg">{t('subtitle')}</p>

        <Button asChild size="lg" className="w-full px-10 text-base sm:w-auto">
          <Link href="/register">{t('button')}</Link>
        </Button>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground/70">{t('disclaimer')}</p>
      </div>
    </section>
  );
}
