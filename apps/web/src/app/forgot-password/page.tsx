import type { Metadata } from 'next';

import { siteConfig } from '@/shared/lib/site-config';
import { ForgotPasswordPage } from '@/views/auth/forgot-password-page';

const isRu = siteConfig.forcedLocale === 'ru';

export const metadata: Metadata = {
  title: isRu ? 'Забыли пароль' : 'Forgot Password',
  robots: { index: false },
};

export default function ForgotPassword() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <ForgotPasswordPage />
    </div>
  );
}
