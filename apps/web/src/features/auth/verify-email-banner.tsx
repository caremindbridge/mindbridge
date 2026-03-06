'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useUser } from '@/entities/user';
import { resendVerification } from '@/shared/api/client';

export function VerifyEmailBanner() {
  const t = useTranslations('auth');
  const { user } = useUser();
  const [resending, setResending] = useState(false);

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    try {
      setResending(true);
      await resendVerification();
      toast.success(t('verificationResent'));
    } catch {
      // silently fail — rate limit message is expected
      toast.info(t('verificationResent'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-800 border-b border-amber-200">
      <span>{t('verifyEmailMessage')}</span>
      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="font-medium underline underline-offset-4 hover:no-underline disabled:opacity-50"
      >
        {t('resendVerification')}
      </button>
    </div>
  );
}
