import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const siteConfig = {
  apiUrl: (extra.apiUrl as string) || 'https://api.mindbridge.me',
  forcedLocale: (extra.forcedLocale as 'en' | 'ru' | '') || '',
  paymentProvider: (extra.paymentProvider as 'stripe' | 'yookassa' | 'none') || 'stripe',
  region: (extra.siteRegion as 'international' | 'russia') || 'international',

  get isRussia() {
    return this.region === 'russia';
  },
  get locale() {
    return this.forcedLocale || 'en';
  },
  get canPay() {
    return this.paymentProvider !== 'none';
  },

  get crisisLine() {
    return this.isRussia ? '8-800-2000-122' : '988 (US) / 112 (EU)';
  },
};
