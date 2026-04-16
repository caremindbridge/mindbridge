'use client';

import { useTranslations } from 'next-intl';

import { RU_SITE_URL, useRuRedirectEligible } from '@/shared/hooks/use-ru-redirect-eligible';

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
  onDismiss?: () => void;
}

export function useNotifications(): NotificationItem[] {
  const t = useTranslations('notifications');
  const { eligible, dismiss } = useRuRedirectEligible();

  const items: NotificationItem[] = [];

  if (eligible) {
    items.push({
      id: 'ru-redirect',
      title: t('ruRedirect.title'),
      description: t('ruRedirect.description'),
      link: { href: RU_SITE_URL, label: 'ru.mindbridge.me' },
      onDismiss: dismiss,
    });
  }

  return items;
}
