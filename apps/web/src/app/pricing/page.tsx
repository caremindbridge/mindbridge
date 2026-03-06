import type { Metadata } from 'next';

import { PricingPage } from '@/views/pricing';

export const metadata: Metadata = {
  title: 'Pricing — Plans for Patients & Therapists',
  description:
    'Choose your MindBridge plan. AI therapy sessions from $9.99/month. Free 7-day trial. Plans for patients and therapists.',
  alternates: { canonical: '/pricing' },
};

export default function Pricing() {
  return <PricingPage />;
}
