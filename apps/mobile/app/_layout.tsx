import { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from '@/shared/api/auth-store';
import { useThemeColors } from '@/shared/lib/useTheme';
import '@/shared/i18n';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const c = useThemeColors();
  const { initialized } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  const onReady = useCallback(async () => {
    if ((fontsLoaded || fontError) && initialized) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, initialized]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  if (!fontsLoaded && !fontError) return null;
  if (!initialized) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={{ flex: 1, backgroundColor: c.background }}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
