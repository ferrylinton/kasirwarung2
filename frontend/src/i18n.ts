import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

export const defaultLanguage = 'id';
export const supportedLanguages = ['id', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const STORAGE_KEY = 'kasir_pos_language';

// Get stored language or default to 'id'
const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'id' || saved === 'en') {
      return saved;
    }
  }
  return defaultLanguage;
};

const initialLang = getInitialLanguage();

// Initialize i18next with HttpBackend to fetch translation files asynchronously from public folder
i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLang,
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false, // React handles XSS escaping
    },
    react: {
      useSuspense: false, // Non-blocking async rendering
    },
  });

// Update the HTML lang attribute dynamically based on current language
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lng);
  }
});

export const changeLanguage = (lng: SupportedLanguage) => {
  i18n.changeLanguage(lng);
};

export default i18n;
