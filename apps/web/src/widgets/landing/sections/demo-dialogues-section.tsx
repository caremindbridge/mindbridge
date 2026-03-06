'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useFadeIn } from '@/shared/hooks/use-fade-in';
import { cn } from '@/shared/lib/utils';

type Message = { role: 'user' | 'mira'; text: string };
type Dialogue = { title: string; tag: string; messages: Message[] };

export function DemoDialoguesSection() {
  const t = useTranslations('landing.demos');
  const ref = useFadeIn<HTMLElement>();
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dialogues: Dialogue[] = [
    {
      title: t('d1Title'),
      tag: t('d1Tag'),
      messages: [
        { role: 'user', text: t('d1u1') },
        { role: 'mira', text: t('d1m1') },
        { role: 'user', text: t('d1u2') },
        { role: 'mira', text: t('d1m2') },
        { role: 'user', text: t('d1u3') },
        { role: 'mira', text: t('d1m3') },
        { role: 'user', text: t('d1u4') },
        { role: 'mira', text: t('d1m4') },
      ],
    },
    {
      title: t('d2Title'),
      tag: t('d2Tag'),
      messages: [
        { role: 'user', text: t('d2u1') },
        { role: 'mira', text: t('d2m1') },
        { role: 'user', text: t('d2u2') },
        { role: 'mira', text: t('d2m2') },
        { role: 'user', text: t('d2u3') },
        { role: 'mira', text: t('d2m3') },
        { role: 'user', text: t('d2u4') },
        { role: 'mira', text: t('d2m4') },
        { role: 'user', text: t('d2u5') },
        { role: 'mira', text: t('d2m5') },
      ],
    },
    {
      title: t('d3Title'),
      tag: t('d3Tag'),
      messages: [
        { role: 'user', text: t('d3u1') },
        { role: 'mira', text: t('d3m1') },
        { role: 'user', text: t('d3u2') },
        { role: 'mira', text: t('d3m2') },
        { role: 'user', text: t('d3u3') },
        { role: 'mira', text: t('d3m3') },
        { role: 'user', text: t('d3u4') },
        { role: 'mira', text: t('d3m4') },
      ],
    },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeIdx]);

  const active = dialogues[activeIdx];

  return (
    <section ref={ref} className="fade-section bg-muted/20 px-6 py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-blush-200 bg-blush-50 px-3 py-1 text-xs font-medium text-blush-600">
              {t('tagline')}
            </span>
            <span className="text-xs text-muted-foreground">{t('poweredBy')}</span>
          </div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {t('sectionTitle')}
          </h2>
        </div>

        {/* Dialogue selector tabs */}
        <div className="-mx-6 mb-4 flex gap-2 overflow-x-auto px-6 pb-1">
          {dialogues.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                'shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                i === activeIdx
                  ? 'border-blush-300 bg-blush-50 text-blush-700'
                  : 'border-border/50 bg-card text-muted-foreground hover:border-blush-200 hover:text-foreground',
              )}
            >
              {d.title}
            </button>
          ))}
        </div>

        {/* Chat card */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft-lg">
          {/* Card header */}
          <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xs font-semibold text-blush-600">
              M
            </div>
            <span className="text-sm font-medium text-foreground">Mira</span>
            <span className="ml-auto rounded-full bg-blush-100 px-2.5 py-0.5 text-xs text-blush-600">
              {active.tag}
            </span>
          </div>

          {/* Scrollable messages */}
          <div className="relative">
            <div ref={scrollRef} className="h-[480px] space-y-3 overflow-y-auto p-4">
              {active.messages.map((msg, i) =>
                msg.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xs font-semibold text-blush-600">
                      M
                    </div>
                    <div className="max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-muted/60 px-4 py-2.5 text-sm leading-relaxed text-foreground">
                      {msg.text}
                    </div>
                  </div>
                ),
              )}
            </div>
            {/* Fade overlay */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
          </div>
        </div>

        {/* Dot navigation */}
        <div className="mt-5 flex justify-center gap-2">
          {dialogues.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === activeIdx ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/40',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
