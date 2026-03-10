import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/shared/api/auth-store';
import { useThemeColors } from '@/shared/lib/useTheme';

export default function AuthLayout() {
  const { user } = useAuthStore();
  const c = useThemeColors();

  if (user) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
