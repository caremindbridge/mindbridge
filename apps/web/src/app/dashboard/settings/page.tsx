import type { Metadata } from 'next';

import { SettingsPage } from '@/views/settings';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsRoute() {
  return <SettingsPage />;
}
