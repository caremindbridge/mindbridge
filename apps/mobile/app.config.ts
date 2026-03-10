import type { ConfigContext, ExpoConfig } from 'expo/config';

const FORCED_LOCALE = process.env.FORCED_LOCALE || '';
const API_URL = process.env.API_URL || 'https://api.mindbridge.me';
const SITE_REGION = process.env.SITE_REGION || 'international';
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'stripe';

const IS_RU = FORCED_LOCALE === 'ru';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: 'azimmemans-organization',
  name: 'MindBridge',
  slug: IS_RU ? 'mindbridge-ru' : 'mindbridge',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: IS_RU ? 'mindbridge-ru' : 'mindbridge',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAF9F7',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_RU ? 'me.mindbridge.ru' : 'me.mindbridge.app',
    config: { usesNonExemptEncryption: false },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#FAF9F7',
    },
    package: IS_RU ? 'me.mindbridge.ru' : 'me.mindbridge.app',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: API_URL,
    forcedLocale: FORCED_LOCALE,
    paymentProvider: PAYMENT_PROVIDER,
    siteRegion: SITE_REGION,
    eas: {
      projectId: '500e3f6d-2f17-4000-bc73-adb42237737a',
    },
  },
});
