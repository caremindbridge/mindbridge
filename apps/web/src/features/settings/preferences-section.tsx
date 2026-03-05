'use client';

import { useTranslations } from 'next-intl';

import { ThemeToggle } from '@/features/theme';
import { useUiStore } from '@/shared/stores/ui-store';
import { Badge, Button, Card, CardContent } from '@/shared/ui';

export function PreferencesSection() {
  const t = useTranslations('settings');
  const { locale, setLocale } = useUiStore();

  return (
    <Card>
      <CardContent className="p-0">
        <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('preferences')}
        </p>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium">{t('language')}</p>
            <div className="flex gap-1">
              <Button
                variant={locale === 'en' ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-12"
                onClick={() => locale !== 'en' && setLocale('en')}
              >
                EN
              </Button>
              <Button
                variant={locale === 'ru' ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-12"
                onClick={() => locale !== 'ru' && setLocale('ru')}
              >
                RU
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium">{t('theme')}</p>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium">{t('notifications')}</p>
            <Badge variant="secondary">{t('comingSoon')}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
