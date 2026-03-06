'use client';

import { Stethoscope, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useUser } from '@/entities/user';
import { switchMode } from '@/shared/api/client';
import { UserRole } from '@mindbridge/types/src/user';


export function ModeSwitcher() {
  const t = useTranslations('mode');
  const { user } = useUser();
  const [switching, setSwitching] = useState(false);

  if (user?.role !== UserRole.THERAPIST) return null;

  const isTherapistMode = (user.activeMode ?? 'therapist') === 'therapist';

  const handleSwitch = async () => {
    const targetMode = isTherapistMode ? 'patient' : 'therapist';
    setSwitching(true);
    try {
      await switchMode(targetMode);
      // Hard redirect so all hooks re-initialize with fresh user data
      window.location.href = targetMode === 'therapist' ? '/dashboard/therapist' : '/dashboard';
    } catch {
      toast.error('Failed to switch mode');
      setSwitching(false);
    }
  };

  return (
    <button
      onClick={handleSwitch}
      disabled={switching}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-blush-50 hover:text-foreground disabled:opacity-50"
    >
      {isTherapistMode ? (
        <>
          <User className="h-3.5 w-3.5 shrink-0" />
          <span>{switching ? t('switching') : t('switchToPatient')}</span>
        </>
      ) : (
        <>
          <Stethoscope className="h-3.5 w-3.5 shrink-0" />
          <span>{switching ? t('switching') : t('switchToTherapist')}</span>
        </>
      )}
    </button>
  );
}
