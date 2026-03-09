import type { Metadata } from 'next';

import { siteConfig } from '@/shared/lib/site-config';

import { LandingPage } from '@/views/landing/landing-page';

const isRu = siteConfig.forcedLocale === 'ru';

export const metadata: Metadata = {
  title: isRu
    ? 'MindBridge — Тревога не ждёт следующей сессии'
    : "MindBridge — Anxiety doesn't wait for your next session",
  description: isRu
    ? 'Поговори с Мирой когда тяжело. AI-компаньон с навыками КПТ-терапевта. Без карты, 7 дней бесплатно.'
    : "Talk to Mira when it's hard. AI companion with CBT skills. No card, 7 days free.",
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MindBridge',
  description:
    'AI companion for mental health — CBT therapy sessions, mood tracking, therapist insights',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '9.99',
    priceCurrency: 'USD',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
