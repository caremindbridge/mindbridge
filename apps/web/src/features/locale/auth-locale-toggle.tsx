'use client';

import { siteConfig } from '@/shared/lib/site-config';
import { useUiStore } from '@/shared/stores/ui-store';

export function AuthLocaleToggle() {
  const { locale, setLocale } = useUiStore();

  if (siteConfig.isLocaleForced) return null;

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}
      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className={locale === 'en' ? 'font-semibold text-foreground' : ''}>EN</span>
      <span className="text-border">/</span>
      <span className={locale === 'ru' ? 'font-semibold text-foreground' : ''}>RU</span>
    </button>
  );
}
