'use client';

import { useTranslations } from 'next-intl';

import { ThemeToggle } from '@/features/theme';
import { Badge, Card, CardContent } from '@/shared/ui';

export function PreferencesSection() {
  const t = useTranslations('settings');

  return (
    <Card>
      <CardContent className="p-0">
        <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('preferences')}
        </p>
        <div className="divide-y divide-border/50">
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
