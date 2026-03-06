'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { forgotPassword } from '@/shared/api/client';
import { Logo } from '@/shared/ui/logo';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/shared/ui';

export function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = z.object({
    email: z.string().email(t('emailInvalid')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { email: string }) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await forgotPassword(data.email);
      setSentTo(data.email);
    } catch {
      setServerError(t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('checkYourEmail')}</CardTitle>
          <CardDescription>
            {t('resetEmailSent', { email: sentTo })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('linkExpiresIn1Hour')}</p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
            {t('backToLogin')}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="mb-2 flex justify-center">
          <Logo size="default" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('forgotPasswordTitle')}</CardTitle>
        <CardDescription>{t('forgotPasswordSubtitle')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('sending') : t('sendResetLink')}
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            {t('backToLogin')}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
