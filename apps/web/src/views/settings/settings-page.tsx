'use client';

import { useTranslations } from 'next-intl';

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
import { Card, CardContent } from '@/shared/ui';

export function SettingsPage() {
  const t = useTranslations('settings');
  const { user, mutate } = useUser();

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
