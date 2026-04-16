'use client';

import { Bell, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui';

import { useNotifications } from './use-notifications';

interface NotificationsBellProps {
  className?: string;
}

export function NotificationsBell({ className }: NotificationsBellProps) {
  const t = useTranslations('notifications');
  const items = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('ariaLabel')}
          className={
            'relative flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
            (className ?? '')
          }
        >
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          {items.length > 0 && (
            <span
              aria-hidden
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[280px] p-0">
        {items.length > 0 ? (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    {(item.description || item.link) && (
                      <p className="text-xs leading-snug text-muted-foreground">
                        {item.description}{' '}
                        {item.link && (
                          <a
                            href={item.link.href}
                            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                          >
                            {item.link.label}
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                  {item.onDismiss && (
                    <button
                      type="button"
                      onClick={item.onDismiss}
                      aria-label={t('dismiss')}
                      className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">{t('empty')}</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
