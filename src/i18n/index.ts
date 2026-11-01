import i18n, { type TFunction } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { PREFIX } from '../lib/storage';
import { en } from './en';
import { he } from './he';

export const languages = ['he', 'en'] as const;
export type Language = (typeof languages)[number];

/** Kept as plain text (not JSON like `storage.ts`), as phones already saved it that way. */
const STORAGE_KEY = `${PREFIX}language`;

const isLanguage = (value: unknown): value is Language => languages.includes(value as Language);

function savedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode) or missing (tests); Hebrew is the default.
  }
  return 'he';
}

// Keeps <html lang dir> in step with the language, so the whole layout mirrors via logical CSS.
i18n.on('languageChanged', (lng) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Not remembering the choice is fine.
  }
});

void i18n.use(initReactI18next).init({
  resources: { he: { translation: he }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'he',
  supportedLngs: languages,
  initAsync: false,
  // React already escapes rendered text.
  interpolation: { escapeValue: false },
});

/** The active language, narrowed to the ones the app supports. */
export function useLanguage(): Language {
  const { i18n: instance } = useTranslation();
  return isLanguage(instance.language) ? instance.language : 'he';
}

/** Trip content in `src/data` is written in Hebrew only (for now). */
const CONTENT_LANGUAGE: Language = 'he';

/**
 * Props for blocks that show trip content. In another UI language they keep the content's own
 * language and direction, so mixed Hebrew/English text doesn't scramble inside an LTR page.
 */
export function useContentProps(): { lang?: Language; dir?: 'rtl' | 'ltr' } {
  const lang = useLanguage();
  if (lang === CONTENT_LANGUAGE) return {};
  return { lang: CONTENT_LANGUAGE, dir: i18n.dir(CONTENT_LANGUAGE) };
}

const placeKeys = Object.fromEntries(
  Object.entries(he.places).map(([key, name]) => [name, key as keyof typeof he.places]),
);

/**
 * A place from the trip data ("טוקיו → קובה", "טוקיו / דיסני") in the active language. Each part
 * is translated on its own; a name without a translation stays as written.
 */
export function placeName(place: string, t: TFunction = i18n.t): string {
  return place
    .split(/(\s*(?:→|\/)\s*)/)
    .map((part) => (placeKeys[part] ? t(`places.${placeKeys[part]}`) : part))
    .join('');
}

export default i18n;
