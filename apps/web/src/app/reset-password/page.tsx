import type { Metadata } from 'next';
import { Suspense } from 'react';

import { siteConfig } from '@/shared/lib/site-config';

import { ResetPasswordPage } from '@/views/auth/reset-password-page';

const isRu = siteConfig.forcedLocale === 'ru';

export const metadata: Metadata = {
  title: isRu ? 'Сброс пароля' : 'Reset Password',
  robots: { index: false },
};

export default function ResetPassword() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense>
        <ResetPasswordPage />
      </Suspense>
    </div>
  );
}
