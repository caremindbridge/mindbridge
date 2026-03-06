'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { verifyEmailToken } from '@/shared/api/client';
import { Logo } from '@/shared/ui/logo';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

function VerifiedContent() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmailToken(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t('verifying')}</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex justify-center">
            <Logo size="default" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('emailVerified')}</CardTitle>
          <CardDescription>{t('emailVerifiedDescription')}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/dashboard">{t('goToDashboard')}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('verificationFailed')}</CardTitle>
        <CardDescription>{t('verificationFailedDescription')}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
          {t('backToLogin')}
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifiedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense>
        <VerifiedContent />
      </Suspense>
    </div>
  );
}
