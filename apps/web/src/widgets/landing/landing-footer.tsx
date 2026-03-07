import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Logo } from '@/shared/ui/logo';

export function LandingFooter() {
  const t = useTranslations('landing.footer');

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-3">
            <Logo size="default" />
            <p className="text-sm text-muted-foreground">{t('tagline')}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('productTitle')}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#features" className="transition-colors hover:text-foreground">
                  {t('features')}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="transition-colors hover:text-foreground">
                  {t('pricing')}
                </Link>
              </li>
              <li>
                <Link href="#therapists" className="transition-colors hover:text-foreground">
                  {t('forTherapists')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('legalTitle')}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-foreground">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-foreground">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="mailto:hello@mindbridge.app" className="transition-colors hover:text-foreground">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-2 border-t border-border/50 pt-8">
          <p className="text-xs text-muted-foreground">{t('crisis')}</p>
          <p className="text-xs text-muted-foreground/50">{t('poweredBy')}</p>
          <p className="text-xs text-muted-foreground">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
