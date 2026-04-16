import type { Metadata } from 'next';

import { siteConfig } from '@/shared/lib/site-config';
import { LoginForm } from '@/features/auth';

const isRu = siteConfig.forcedLocale === 'ru';

export const metadata: Metadata = {
  title: isRu ? 'Вход' : 'Log in',
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm />
    </div>
  );
}
