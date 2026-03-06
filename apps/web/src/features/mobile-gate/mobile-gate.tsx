'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Logo } from '@/shared/ui/logo';

const MOBILE_BREAKPOINT = 768;

export function MobileGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    setChecked(true);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!checked) return <>{children}</>;
  if (isMobile) return <MobileComingSoon />;
  return <>{children}</>;
}

function MobileComingSoon() {
  const t = useTranslations('mobile');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-8">
        <Logo size="large" />
      </div>

      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      </div>

      <h1 className="mb-3 text-2xl font-bold tracking-tight">{t('title')}</h1>

      <p className="mb-6 max-w-sm leading-relaxed text-muted-foreground">{t('description')}</p>

      <div className="mb-8 flex gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2 text-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
          </svg>
          <span className="text-muted-foreground">{t('ios')}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2 text-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
            <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C14.15 1.23 13.1 1 12 1c-1.1 0-2.15.23-3.09.63L7.43.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C6.01 3.07 5 5.13 5 7.5V8h14v-.5c0-2.37-1.01-4.43-2.97-5.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
          </svg>
          <span className="text-muted-foreground">{t('android')}</span>
        </div>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">{t('useDesktop')}</p>

      <a href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        {t('openDesktop')}
      </a>
    </div>
  );
}
