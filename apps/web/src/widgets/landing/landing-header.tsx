'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useUser } from '@/entities/user/model';
import { AuthLocaleToggle } from '@/features/locale';
import { ThemeToggle } from '@/features/theme';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Logo } from '@/shared/ui/logo';

export function LandingHeader() {
  const t = useTranslations('landing.nav');
  const { user, isLoading } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? 'border-b border-border/60 bg-background/90 backdrop-blur-md shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo size="default" />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="#therapists" className="transition-colors hover:text-foreground">
            {t('forTherapists')}
          </Link>
          <Link href="#pricing" className="transition-colors hover:text-foreground">
            {t('pricing')}
          </Link>
        </nav>

        {/* Desktop right actions */}
        <div className="hidden items-center gap-2 md:flex">
          <AuthLocaleToggle />
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
                    <Link href="/login">{t('register')}</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile: locale toggle + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <AuthLocaleToggle />
          <button
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 md:hidden',
          open ? 'max-h-56' : 'max-h-0',
        )}
      >
        <div className="border-t border-border/30 bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="space-y-0.5">
            {!isLoading && (
              <>
                {user ? (
                  <Link
                    href={user.role === 'therapist' ? '/dashboard/therapist' : '/dashboard'}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2 py-2.5 text-sm font-medium text-primary"
                  >
                    {t('dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-2 py-2.5 text-sm text-foreground/80 hover:text-foreground"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-2 py-2.5 text-sm font-medium text-primary"
                    >
                      {t('register')}
                    </Link>
                  </>
                )}
              </>
            )}
            <div className="border-t border-border/30 pt-1">
              <Link
                href="#therapists"
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-2.5 text-sm text-foreground/70 hover:text-foreground"
              >
                {t('forTherapists')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
