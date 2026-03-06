'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type Message = { role: 'user' | 'mira'; text: string };
type Dialogue = { title: string; tag: string; messages: Message[] };

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const d = useTranslations('landing.demos');
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dialogues: Dialogue[] = [
    {
      title: d('d1Title'),
      tag: d('d1Tag'),
      messages: [
        { role: 'user', text: d('d1u1') },
        { role: 'mira', text: d('d1m1') },
        { role: 'user', text: d('d1u2') },
        { role: 'mira', text: d('d1m2') },
        { role: 'user', text: d('d1u3') },
        { role: 'mira', text: d('d1m3') },
        { role: 'user', text: d('d1u4') },
        { role: 'mira', text: d('d1m4') },
      ],
    },
    {
      title: d('d2Title'),
      tag: d('d2Tag'),
      messages: [
        { role: 'user', text: d('d2u1') },
        { role: 'mira', text: d('d2m1') },
        { role: 'user', text: d('d2u2') },
        { role: 'mira', text: d('d2m2') },
        { role: 'user', text: d('d2u3') },
        { role: 'mira', text: d('d2m3') },
        { role: 'user', text: d('d2u4') },
        { role: 'mira', text: d('d2m4') },
        { role: 'user', text: d('d2u5') },
        { role: 'mira', text: d('d2m5') },
      ],
    },
    {
      title: d('d3Title'),
      tag: d('d3Tag'),
      messages: [
        { role: 'user', text: d('d3u1') },
        { role: 'mira', text: d('d3m1') },
        { role: 'user', text: d('d3u2') },
        { role: 'mira', text: d('d3m2') },
        { role: 'user', text: d('d3u3') },
        { role: 'mira', text: d('d3m3') },
        { role: 'user', text: d('d3u4') },
        { role: 'mira', text: d('d3m4') },
      ],
    },
  ];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeIdx]);

  const active = dialogues[activeIdx];

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

          <p className="text-xs text-muted-foreground/70">{d('poweredBy')}</p>
        </div>

        {/* Right: dialogue carousel */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full space-y-3">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {dialogues.map((dial, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-xs font-medium transition-all',
                    i === activeIdx
                      ? 'bg-blush-100 text-blush-700'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {dial.tag}
                </button>
              ))}
            </div>

            {/* Card */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft-lg">
              {/* Card header */}
              <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xs font-semibold text-blush-600">
                  M
                </div>
                <span className="text-sm font-medium text-foreground">Mira</span>
                <span className="ml-auto rounded-full bg-blush-50 px-2.5 py-0.5 text-xs text-blush-600">
                  {active.title}
                </span>
              </div>

              {/* Messages */}
              <div className="relative">
                <div ref={scrollRef} className="h-[500px] space-y-2.5 overflow-y-auto p-4">
                  {active.messages.map((msg, i) =>
                    msg.role === 'user' ? (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-xs leading-relaxed text-primary-foreground">
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="flex gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xs font-semibold text-blush-600">
                          M
                        </div>
                        <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-muted/60 px-3.5 py-2 text-xs leading-relaxed text-foreground">
                          {msg.text}
                        </div>
                      </div>
                    ),
                  )}
                </div>
                {/* Fade */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-card to-transparent" />
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5">
              {dialogues.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeIdx ? 'w-5 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/40',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
