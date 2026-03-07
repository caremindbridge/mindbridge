'use client';

import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';

export function BridgeSection() {
  const t = useTranslations('landing.bridge');
  const ref = useFadeIn<HTMLElement>();

  return (
    <section ref={ref} className="fade-section bg-primary/5 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-3 text-center font-serif text-2xl font-medium tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
          {t('subtitle')}
        </p>

        <div className="mb-10 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-0">
          <div className="w-full max-w-[200px] rounded-2xl bg-background p-5 text-center shadow-soft">
            <div className="mb-2 text-3xl">💬</div>
            <p className="text-sm font-semibold text-foreground">{t('you')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('youDesc')}</p>
          </div>

          <div className="rotate-90 px-2 text-2xl text-primary md:rotate-0">→</div>

          <div className="w-full max-w-[200px] rounded-2xl border-2 border-primary/30 bg-primary/10 p-5 text-center">
            <div className="mb-2 text-3xl">🌿</div>
            <p className="text-sm font-semibold text-foreground">{t('mira')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('miraDesc')}</p>
          </div>

          <div className="rotate-90 px-2 text-2xl text-primary md:rotate-0">→</div>

          <div className="w-full max-w-[200px] rounded-2xl bg-background p-5 text-center shadow-soft">
            <div className="mb-2 text-3xl">🧑‍⚕️</div>
            <p className="text-sm font-semibold text-foreground">{t('therapist')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('therapistDesc')}</p>
          </div>
        </div>

        <p className="mx-auto max-w-xl text-center text-base font-medium text-foreground md:text-lg">
          {t('result')}
        </p>
      </div>
    </section>
  );
}
