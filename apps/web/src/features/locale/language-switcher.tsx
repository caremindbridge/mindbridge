'use client';

import { useUiStore } from '@/shared/stores/ui-store';
import { Button } from '@/shared/ui/button';

export function LanguageSwitcher() {
  const { locale, setLocale } = useUiStore();
  return (
    <Button variant="ghost" size="sm" onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}>
      {locale === 'en' ? 'RU' : 'EN'}
    </Button>
  );
}
