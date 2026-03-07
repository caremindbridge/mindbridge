'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';

export function FounderSection() {
  const t = useTranslations('landing.founder');
  const ref = useFadeIn<HTMLElement>();

  return (
    <section ref={ref} className="fade-section bg-blush-50 px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center font-serif text-xl font-medium tracking-tight text-foreground md:text-2xl">
          {t('sectionTitle')}
        </h2>

        <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
          {/* Text */}
          <div className="flex-1">
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80 md:text-base">
              <p>{t('p1')}</p>
              <p>{t('p2')}</p>
              <p>{t('p3')}</p>
              <p>{t('p4')}</p>
              <p className="font-medium text-foreground">{t('p5')}</p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-border/50" />
              <p className="text-sm font-medium text-muted-foreground">{t('signature')}</p>
            </div>
          </div>

          {/* Photo */}
          <div className="flex shrink-0 flex-col items-center gap-3 md:order-2">
            <div className="relative h-40 w-40 overflow-hidden rounded-full shadow-lg ring-4 ring-blush-200 ring-offset-4 ring-offset-blush-50 md:h-56 md:w-56">
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
