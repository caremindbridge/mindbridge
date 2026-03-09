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
  SubscriptionSection,
  TherapistConnectionSection,
} from '@/features/settings';
import { analytics } from '@/shared/lib/analytics';
import { Button, Card, CardContent } from '@/shared/ui';

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
    <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">

      <div className="p-4 md:p-6">
      <h1 className="mb-6 hidden lg:block text-2xl font-semibold tracking-tight">{t('title')}</h1>

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
          <SubscriptionSection />
          <SecuritySection user={user} />
          {!isTherapist && <TherapistConnectionSection />}

          {/* Logout — mobile only */}
          <Card className="lg:hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-sm font-medium">{t('logout')}</p>
                <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0 gap-1.5">
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <PreferencesSection />
          <DangerSection />
        </div>
      </div>
      </div>
    </div>
  );
}
