import type { Metadata } from 'next';

import { LandingPage } from '@/views/landing/landing-page';

export const metadata: Metadata = {
  title: 'MindBridge — AI Companion for Mental Health',
  description:
    'Talk to Mira, your AI companion trained in CBT. Track your mood, understand your patterns, and share insights with your therapist.',
  openGraph: {
    title: 'MindBridge — AI Companion for Mental Health',
    description: 'Your AI companion between therapy sessions. Free to start.',
    type: 'website',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
