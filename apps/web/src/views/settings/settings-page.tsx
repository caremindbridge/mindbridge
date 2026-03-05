'use client';

import { useTranslations } from 'next-intl';

import { useUser } from '@/entities/user';
import {
  DangerSection,
  PracticeSection,
  PreferencesSection,
  ProfileSection,
  SecuritySection,
  TherapistConnectionSection,
} from '@/features/settings';

export function SettingsPage() {
  const t = useTranslations('settings');
  const { user, mutate } = useUser();

  if (!user) return null;

  const isTherapist = user.role === 'therapist';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t('title')}</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-5">
          <ProfileSection user={user} onUpdated={mutate} />
          <SecuritySection user={user} />
          {!isTherapist && <TherapistConnectionSection />}
          {isTherapist && <PracticeSection />}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <PreferencesSection />
          <DangerSection />
        </div>
      </div>
    </div>
  );
}
