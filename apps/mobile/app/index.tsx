import { Redirect } from 'expo-router';

import { useAuthStore } from '@/shared/api/auth-store';

export default function Index() {
  const { user } = useAuthStore();
  return <Redirect href={user ? '/(tabs)' : '/(auth)/login'} />;
}
