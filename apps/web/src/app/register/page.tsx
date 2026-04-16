import type { Metadata } from 'next';

import { siteConfig } from '@/shared/lib/site-config';

import { RegisterForm } from '@/features/auth';

const isRu = siteConfig.forcedLocale === 'ru';

export const metadata: Metadata = {
  title: isRu ? 'Регистрация' : 'Sign up',
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <RegisterForm />
    </div>
  );
}
