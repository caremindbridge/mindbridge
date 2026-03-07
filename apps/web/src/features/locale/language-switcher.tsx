'use client';

import { analytics } from '@/shared/lib/analytics';
import { siteConfig } from '@/shared/lib/site-config';
import { useUiStore } from '@/shared/stores/ui-store';
import { Button } from '@/shared/ui/button';

export function LanguageSwitcher() {
  const { locale, setLocale } = useUiStore();

  if (siteConfig.isLocaleForced) return null;

  const handleSwitch = () => {
    const next = locale === 'en' ? 'ru' : 'en';
    analytics.languageChanged(locale, next);
    setLocale(next);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleSwitch}>
      {locale === 'en' ? 'RU' : 'EN'}
    </Button>
  );
}
