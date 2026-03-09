import type { Metadata } from 'next';

import { siteConfig } from '@/shared/lib/site-config';

import { PricingPage } from '@/views/pricing';

const isRu = siteConfig.forcedLocale === 'ru';

export const metadata: Metadata = {
  title: isRu ? 'Цены — тарифы для пациентов и терапевтов' : 'Pricing — Plans for Patients & Therapists',
  description: isRu
    ? 'Тарифы MindBridge — от 999 ₽/мес. 7 дней бесплатно. Планы для пациентов и терапевтов.'
    : 'Choose your MindBridge plan. AI therapy sessions from $9.99/month. Free 7-day trial. Plans for patients and therapists.',
  alternates: { canonical: '/pricing' },
};

export default function Pricing() {
  return <PricingPage />;
}
