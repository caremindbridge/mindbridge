import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';

import './globals.css';

import { RuRedirectBanner } from '@/features/locale/ru-redirect-banner';
import { QueryProvider } from '@/providers/query-provider';
import { PostHogProvider } from '@/shared/lib/posthog-provider';
import { siteConfig } from '@/shared/lib/site-config';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'cyrillic-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const isRu = siteConfig.forcedLocale === 'ru';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: isRu
      ? 'MindBridge — AI-компаньон для ментального здоровья'
      : 'MindBridge — AI Mental Health Companion',
    template: '%s | MindBridge',
  },
  description: isRu
    ? 'Поговори с Мирой когда тяжело. AI-компаньон между сессиями терапии. Без осуждения, в любое время.'
    : "Talk to Mira when it's hard. AI companion between therapy sessions. No judgment, anytime.",
  keywords: isRu
    ? ['ментальное здоровье', 'психотерапия', 'КПТ', 'тревожность', 'AI терапевт', 'Мира', 'MindBridge']
    : ['mental health', 'therapy', 'CBT', 'anxiety', 'AI therapist', 'Mira', 'MindBridge'],
  authors: [{ name: 'MindBridge' }],
  creator: 'MindBridge',
  openGraph: {
    type: 'website',
    siteName: 'MindBridge',
    title: isRu
      ? 'MindBridge — Мира выслушает когда тяжело'
      : "MindBridge — Mira listens when it's hard",
    description: isRu
      ? 'AI-компаньон между сессиями терапии'
      : 'AI companion between therapy sessions',
    locale: isRu ? 'ru_RU' : 'en_US',
    url: siteConfig.siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: isRu
      ? 'MindBridge — Мира выслушает когда тяжело'
      : "MindBridge — Mira listens when it's hard",
    description: isRu
      ? 'AI-компаньон между сессиями терапии'
      : 'AI companion between therapy sessions',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  applicationName: 'MindBridge',
  appleWebApp: {
    capable: true,
    title: 'MindBridge',
    statusBarStyle: 'default',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF9F7' },
    { media: '(prefers-color-scheme: dark)', color: '#191412' },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang={siteConfig.forcedLocale || 'en'} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==='dark'||(!localStorage.theme&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} ${fraunces.variable} font-sans`}>
        <RuRedirectBanner />
        <PostHogProvider>
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>{children}</QueryProvider>
            <Toaster richColors closeButton />
          </NextIntlClientProvider>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
