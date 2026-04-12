'use client';

import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { useUser } from '@/entities/user';
import { ModeSwitcher } from '@/features/auth';
import {
  DangerSection,
  PreferencesSection,
  ProfileSection,
  SecuritySection,
  // SubscriptionSection, // commented out for MVP
  TherapistConnectionSection,
} from '@/features/settings';
import { analytics } from '@/shared/lib/analytics';
import { Card, CardContent } from '@/shared/ui';

export function SettingsPage() {
  const t = useTranslations('settings');
  const { user, mutate } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    analytics.reset();
    Cookies.remove('token');
    queryClient.clear();
    router.push('/login');
  };

  if (!user) return null;

  const isTherapist = user.role === 'therapist';

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto pb-24 lg:pb-0">
      <div className="w-full p-4 md:p-6">
        <h1 className="mb-6 hidden text-2xl font-semibold tracking-tight lg:block">
          {t('title')}
        </h1>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-5">
            {/* Mode switcher — mobile only, therapists only */}
            {isTherapist && (
              <Card className="lg:hidden">
                <CardContent className="p-4">
                  <ModeSwitcher />
                </CardContent>
              </Card>
            )}
            <ProfileSection user={user} onUpdated={mutate} />
            {/* <SubscriptionSection /> */}
            <SecuritySection user={user} />
            {!isTherapist && <TherapistConnectionSection />}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <PreferencesSection />
            <DangerSection />
          </div>
        </div>

        {/* Logout — mobile only, always at the very bottom */}
        <div className="mt-5 lg:hidden">
          <Card>
            <CardContent className="p-0">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-5 py-4 text-left text-destructive transition-colors active:bg-muted/50"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{t('logout')}</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
