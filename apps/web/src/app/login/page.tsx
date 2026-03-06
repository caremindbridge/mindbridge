import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth';
import { AuthLocaleToggle } from '@/features/locale';

export const metadata: Metadata = {
  title: 'Login',
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <AuthLocaleToggle />
      </div>
      <LoginForm />
    </div>
  );
}
