'use client';

import { useTranslations } from 'next-intl';

import { usePatients } from '@/entities/therapist';
import { Badge, Button, Card, CardContent } from '@/shared/ui';

export function PracticeSection() {
  const t = useTranslations('settings');
  const { data: patients } = usePatients();

  const activeCount = patients?.filter((p) => p.linkStatus === 'active').length ?? 0;

  return (
    <Card>
      <CardContent className="p-0">
        <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('practice')}
        </p>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium">{t('activePatients', { count: activeCount })}</p>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium">{t('plan')}</p>
              <Badge variant="secondary" className="mt-1">{t('free')}</Badge>
            </div>
            <Button variant="outline" size="sm" disabled>
              {t('manageSubscription')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
