import type { Metadata } from 'next';

import { AboutMePage } from '@/views/about-me/about-me-page';

export const metadata: Metadata = { title: 'About Me' };

export default function AboutMeRoute() {
  return <AboutMePage />;
}
