import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'ru'] as const;
type Locale = (typeof locales)[number];

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get('locale')?.value;
  const acceptLanguage = headers().get('accept-language');
  const preferred = acceptLanguage?.split(',')[0]?.trim().split('-')[0];

  const locale: Locale =
    (cookieLocale && isLocale(cookieLocale) ? cookieLocale : null) ??
    (preferred && isLocale(preferred) ? preferred : null) ??
    'en';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
