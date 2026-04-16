'use client';

import { X } from 'lucide-react';

import { useRuRedirectEligible, RU_SITE_URL } from '@/shared/hooks/use-ru-redirect-eligible';

export function RuRedirectBanner() {
  const { eligible, dismiss } = useRuRedirectEligible();

  if (!eligible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] border-b border-border/60 bg-muted/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs text-muted-foreground sm:text-sm">
        <span className="leading-snug">
          Доступна русская версия —{' '}
          <a
            href={RU_SITE_URL}
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            ru.mindbridge.me
          </a>
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Закрыть"
          className="shrink-0 rounded-md p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
