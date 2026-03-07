import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import './globals.css';

import { PostHogProvider } from '@/shared/lib/posthog-provider';
import { QueryProvider } from '@/providers/query-provider';

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mindbridge.app';

export const metadata: Metadata = {
  title: {
    default: 'MindBridge — Anxiety doesn\'t wait. Neither does Mira.',
    template: '%s | MindBridge',
  },
  description:
    'Talk to Mira when it\'s hard. She listens, helps untangle your thoughts, and won\'t say "just don\'t think about it." Free 7-day trial, no card needed.',
  keywords: [
    'AI therapy',
    'mental health',
    'CBT',
    'cognitive behavioral therapy',
    'mood tracking',
    'anxiety',
    'depression',
    'therapist platform',
    'AI companion',
    'MindBridge',
    'Mira',
  ],
  authors: [{ name: 'MindBridge' }],
  creator: 'MindBridge',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    siteName: 'MindBridge',
    title: 'MindBridge — Anxiety doesn\'t wait. Neither does Mira.',
    description:
      'Talk to Mira when it\'s hard. She listens, helps untangle your thoughts, and won\'t say "just don\'t think about it." Free 7-day trial, no card needed.',
    locale: 'en_US',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MindBridge — Anxiety doesn\'t wait. Neither does Mira.',
    description:
      'Talk to Mira when it\'s hard. She listens, helps untangle your thoughts, and won\'t say "just don\'t think about it."',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==='dark'||(!localStorage.theme&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} ${fraunces.variable} font-sans`}>
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
