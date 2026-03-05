'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { Button } from '@/shared/ui/button';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const chatRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16">
      {/* Soft background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Left: headline + CTAs */}
        <div className="space-y-8">
          <div className="space-y-5">
            <h1 className="font-serif text-5xl font-medium leading-tight tracking-tight text-foreground md:text-6xl">
              {t('title')}
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="px-8 text-base">
              <Link href="/register">{t('cta')}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="px-8 text-base">
              <Link href="#therapists">{t('ctaTherapist')}</Link>
            </Button>
          </div>
        </div>

        {/* Right: chat preview */}
        <div ref={chatRef} className="flex justify-center lg:justify-end">
          <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-soft-lg">
            <div className="border-b border-border/50 px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">{t('chatLabel')}</p>
            </div>
            <div className="space-y-3 p-4">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {t('chatMessage1')}
                </div>
              </div>
              {/* Mira reply */}
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xs font-semibold text-blush-600">
                  M
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-muted/60 px-4 py-2.5 text-sm text-foreground">
                  {t('chatReply1')}
                </div>
              </div>
              {/* User message 2 */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {t('chatMessage2')}
                </div>
              </div>
              {/* Mira reply 2 */}
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xs font-semibold text-blush-600">
                  M
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-muted/60 px-4 py-2.5 text-sm text-foreground">
                  {t('chatReply2')}
                </div>
              </div>
              {/* Typing indicator */}
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xs font-semibold text-blush-600">
                  M
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
