'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { siteConfig } from '@/shared/lib/site-config';

const DISMISS_KEY = 'ru_redirect_dismissed';
const RU_SITE_URL = 'https://ru.mindbridge.me';

export function RuRedirectBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on international (EN) deploy
    if (siteConfig.isRussia) return;
    // Only show if locale is forced (i.e., we're a single-locale deploy)
    if (!siteConfig.isLocaleForced) return;
    // Only show to Russian-language browsers
    const lang = navigator.language || '';
    if (!lang.toLowerCase().startsWith('ru')) return;
    // Respect dismiss
    if (localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="fixed left-0 right-0 top-14 z-40 flex items-center justify-between gap-3 bg-primary px-4 py-2 text-sm text-primary-foreground md:top-16">
      <span>
        Есть русскоязычная версия MindBridge —{' '}
        <a href={RU_SITE_URL} className="font-semibold underline underline-offset-2">
          ru.mindbridge.me
        </a>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Закрыть"
        className="shrink-0 opacity-80 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
