import type { Metadata } from 'next';

import { LandingPage } from '@/views/landing/landing-page';

export const metadata: Metadata = {
  title: 'MindBridge — AI Companion for Mental Health',
  description:
    'Talk to Mira, your AI CBT therapist. Track mood, understand patterns, share insights with your therapist. Start free trial.',
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
