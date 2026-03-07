'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/button';

export function HeroSection() {
  const t = useTranslations('landing.hero');

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 pb-12 pt-20 text-center md:px-6 md:pb-16 md:pt-32">
      {/* Soft background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-5">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="block leading-tight">{t('line1')}</span>
            <span className="mt-3 block leading-tight text-primary">{t('line2')}</span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t('subtitle')}
          </p>
        </div>

        <Button asChild size="lg" className="rounded-full px-8 text-base">
          <Link href="/login">{t('cta')}</Link>
        </Button>

        <p className="text-sm text-muted-foreground">{t('note')}</p>

        {/* Founder quote */}
        <div className="mx-auto max-w-2xl">
          <blockquote className="border-l-2 border-primary/30 pl-4 text-left text-sm italic leading-relaxed text-foreground/70 md:text-base">
            {t('founderQuote')}
          </blockquote>
          <p className="mt-2 pl-4 text-left text-xs text-muted-foreground">— {t('founderName')}</p>
        </div>
      </div>
    </section>
  );
}
