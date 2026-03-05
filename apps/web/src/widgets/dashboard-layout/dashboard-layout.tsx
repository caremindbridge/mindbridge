'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';

import { useUser } from '@/entities/user';
import { SubscriptionBanner } from '@/features/subscription';
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
