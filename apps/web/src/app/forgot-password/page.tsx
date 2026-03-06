import type { Metadata } from 'next';

import { AuthLocaleToggle } from '@/features/locale';
import { ForgotPasswordPage } from '@/views/auth/forgot-password-page';

export const metadata: Metadata = {
  title: 'Forgot Password',
  robots: { index: false },
};

export default function ForgotPassword() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <AuthLocaleToggle />
      </div>
      <ForgotPasswordPage />
    </div>
  );
}
