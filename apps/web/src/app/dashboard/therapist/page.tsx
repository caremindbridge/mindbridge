import type { Metadata } from 'next';

import { TherapistDashboardPage } from '@/views/therapist-dashboard';

export const metadata: Metadata = { title: 'My Patients' };

export default function TherapistDashboardRoute() {
  return <TherapistDashboardPage />;
}
