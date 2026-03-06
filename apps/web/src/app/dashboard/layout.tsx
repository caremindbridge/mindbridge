import type { Metadata } from 'next';

import { DashboardLayout } from '@/widgets/dashboard-layout';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
