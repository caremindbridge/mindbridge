'use client';

import { useCallback, useEffect, useState } from 'react';

import { siteConfig } from '@/shared/lib/site-config';

export const RU_SITE_URL = 'https://ru.mindbridge.me';
const DISMISS_KEY = 'ru_redirect_dismissed';

/**
 * Returns whether the current visitor is eligible to be nudged toward the
 * Russian-language deploy (ru.mindbridge.me), and a dismiss handler that
 * persists the decision in localStorage.
 *
 * Eligibility:
 * - Not already on the RU deploy
 * - This is a single-locale (forced) deploy
 * - Browser language starts with "ru"
 * - User hasn't dismissed the prompt before
 */
export function useRuRedirectEligible() {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (siteConfig.isRussia) return;
    if (!siteConfig.isLocaleForced) return;

    const lang = navigator.language || '';
    if (!lang.toLowerCase().startsWith('ru')) return;

    if (localStorage.getItem(DISMISS_KEY)) return;

    setEligible(true);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setEligible(false);
  }, []);

  return { eligible, dismiss };
}
