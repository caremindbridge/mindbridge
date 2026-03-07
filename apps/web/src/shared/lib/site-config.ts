export const siteConfig = {
  forcedLocale: process.env.NEXT_PUBLIC_FORCED_LOCALE as 'en' | 'ru' | undefined,
  paymentProvider: (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'stripe') as
    | 'stripe'
    | 'yookassa'
    | 'none',
  region: (process.env.NEXT_PUBLIC_SITE_REGION || 'international') as 'international' | 'russia',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://mindbridge.me',
  get isRussia() {
    return this.region === 'russia';
  },
  get isLocaleForced() {
    return !!this.forcedLocale;
  },
  get canPay() {
    return this.paymentProvider !== 'none';
  },
};
