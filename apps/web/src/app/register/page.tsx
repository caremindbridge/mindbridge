import type { Metadata } from 'next';

import { siteConfig } from '@/shared/lib/site-config';

import { RegisterForm } from '@/features/auth';
import { AuthLocaleToggle } from '@/features/locale';

const isRu = siteConfig.forcedLocale === 'ru';

export const metadata: Metadata = {
  title: isRu ? 'Регистрация' : 'Sign up',
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <AuthLocaleToggle />
      </div>
      <RegisterForm />
    </div>
  );
}
