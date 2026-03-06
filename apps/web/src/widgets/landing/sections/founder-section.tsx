'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';

export function FounderSection() {
  const t = useTranslations('landing.founder');
  const ref = useFadeIn<HTMLElement>();

  return (
    <section ref={ref} className="fade-section bg-blush-50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-12 md:flex-row md:items-center md:gap-16">
          {/* Text */}
          <div className="flex-1">
            <blockquote className="mb-8 border-l-2 border-blush-300 pl-5 font-serif text-3xl font-medium leading-snug text-foreground md:text-4xl">
              &ldquo;{t('quote')}&rdquo;
            </blockquote>

            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{t('body1')}</p>
              <p>{t('body2')}</p>
              <p className="font-medium text-foreground">{t('body3')}</p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-border/50" />
              <p className="text-sm font-medium text-muted-foreground">{t('signature')}</p>
            </div>
          </div>

          {/* Photo */}
          <div className="flex shrink-0 flex-col items-center gap-3 md:order-2">
            <div className="relative h-56 w-56 overflow-hidden rounded-full shadow-lg ring-4 ring-blush-200 ring-offset-4 ring-offset-blush-50">
              <Image
                src="/founder.png"
                alt="Alex"
                fill
                className="object-cover object-top"
                sizes="224px"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
