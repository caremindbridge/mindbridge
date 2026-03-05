'use client';

import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { getMe } from '@/shared/api/client';
import { UserRole } from '@mindbridge/types/src/user';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      router.replace('/login');
      return;
    }

    Cookies.set('token', token, { expires: 7 });

    getMe()
      .then((user) => {
        router.replace(
          user.role === UserRole.THERAPIST ? '/dashboard/therapist' : '/dashboard',
        );
      })
      .catch(() => {
        Cookies.remove('token');
        router.replace('/login');
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
