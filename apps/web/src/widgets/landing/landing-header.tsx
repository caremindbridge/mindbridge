'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useUser } from '@/entities/user/model';
import { ThemeToggle } from '@/features/theme';
import { Button } from '@/shared/ui/button';

export function LandingHeader() {
  const t = useTranslations('landing.nav');
  const { user, isLoading } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border/60 bg-background/90 backdrop-blur-md shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          MindBridge
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link
            href="#therapists"
            className="transition-colors hover:text-foreground"
          >
            {t('forTherapists')}
          </Link>
          <Link
            href="#pricing"
            className="transition-colors hover:text-foreground"
          >
            {t('pricing')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isLoading && (
            <>
              {user ? (
                <Button asChild size="sm">
                  <Link href={user.role === 'therapist' ? '/dashboard/therapist' : '/dashboard'}>
                    {t('dashboard')}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">{t('login')}</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">{t('register')}</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
