'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useFadeIn } from '@/shared/hooks/use-fade-in';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

export function TwoPathsSection() {
  const t = useTranslations('landing.twoPaths');
  const ht = useTranslations('landing.hero');
  const ref = useFadeIn<HTMLElement>();

  return (
    <section ref={ref} className="fade-section px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center font-serif text-2xl font-medium tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="flex flex-col p-6">
            <div className="mb-3 text-3xl">🧑</div>
            <h3 className="mb-2 text-base font-semibold text-foreground">{t('patientTitle')}</h3>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">{t('patientDesc')}</p>
            <Button className="mt-auto w-full" asChild>
              <Link href="/login">{ht('cta')}</Link>
            </Button>
          </Card>

          <Card className="flex flex-col bg-muted/30 p-6">
            <div className="mb-3 text-3xl">🧑‍⚕️</div>
            <h3 className="mb-2 text-base font-semibold text-foreground">{t('therapistTitle')}</h3>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">{t('therapistDesc')}</p>
            <Button variant="outline" className="mt-auto w-full" asChild>
              <Link href="/register?role=therapist">{t('therapistCta')}</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
