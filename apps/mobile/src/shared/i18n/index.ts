import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { siteConfig } from '../lib/site-config';
import en from './en.json';
import ru from './ru.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: siteConfig.locale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
