'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';

import { useUser } from '@/entities/user';
import { SubscriptionBanner } from '@/features/subscription';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { MobileTabBar } from '@/widgets/mobile-nav/mobile-tab-bar';
import { Sidebar } from '@/widgets/sidebar';

function StripeReturnHandler() {
  const searchParams = useSearchParams();
  const t = useTranslations('subscription');
  const queryClient = useQueryClient();

  useEffect(() => {
    const upgraded = searchParams.get('upgraded');
    const packPurchased = searchParams.get('pack_purchased');
    if (upgraded === 'true') {
      toast.success(t('planUpgraded'));
      queryClient.invalidateQueries({ queryKey: ['usage-status'] });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (packPurchased === 'true') {
      toast.success(t('packPurchased'));
      queryClient.invalidateQueries({ queryKey: ['usage-status'] });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, t, queryClient]);

  return null;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, error } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Hide tab bar and use full-height layout inside active chat sessions
  const inChat =
    /^\/dashboard\/chat\/[^/]+$/.test(pathname) && !pathname.endsWith('/analysis');

  useEffect(() => {
    if (!isLoading && !user && error) {
      router.push('/login');
    }
  }, [isLoading, user, error, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isDesktop) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden pl-64">
          <SubscriptionBanner />

          <Suspense>
            <StripeReturnHandler />
          </Suspense>
          {children}
        </main>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      <SubscriptionBanner />
      <Suspense>
        <StripeReturnHandler />
      </Suspense>
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </main>
      {/* Fixed — floats over content for liquid glass effect */}
      <MobileTabBar hide={inChat} />
    </div>
  );
}
