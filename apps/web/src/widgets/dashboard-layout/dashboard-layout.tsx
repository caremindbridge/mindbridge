'use client';

// TODO: Re-enable when monetization is ready
// import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
// import { toast } from 'sonner';

import { useUser } from '@/entities/user';
// import { SubscriptionBanner } from '@/features/subscription';
// import { completeCheckout } from '@/shared/api/client';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { MobileTabBar } from '@/widgets/mobile-nav/mobile-tab-bar';
import { Sidebar } from '@/widgets/sidebar';

// TODO: Re-enable when monetization is ready
// function StripeReturnHandler() {
//   const searchParams = useSearchParams();
//   const t = useTranslations('subscription');
//   const queryClient = useQueryClient();
//   useEffect(() => {
//     const upgraded = searchParams.get('upgraded');
//     const packPurchased = searchParams.get('pack_purchased');
//     const sessionId = searchParams.get('session_id');
//     if (upgraded === 'true' || packPurchased === 'true') {
//       const activate = async () => {
//         if (sessionId) await completeCheckout(sessionId).catch(() => {});
//         await queryClient.invalidateQueries({ queryKey: ['usage-status'] });
//         toast.success(upgraded === 'true' ? t('planUpgraded') : t('packPurchased'));
//         window.history.replaceState({}, '', window.location.pathname);
//       };
//       void activate();
//     }
//   }, [searchParams, t, queryClient]);
//   return null;
// }

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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden pl-64">
          {/* TODO: Re-enable when monetization is ready */}
          {/* <SubscriptionBanner /> */}
          {/* <Suspense><StripeReturnHandler /></Suspense> */}
          {children}
        </main>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      {/* TODO: Re-enable when monetization is ready */}
      {/* <SubscriptionBanner /> */}
      {/* <Suspense><StripeReturnHandler /></Suspense> */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </main>
      {/* Fixed — floats over content for liquid glass effect */}
      <MobileTabBar hide={inChat} />
    </div>
  );
}
