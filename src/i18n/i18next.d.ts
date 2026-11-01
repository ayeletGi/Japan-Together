import 'i18next';
import type { Translation } from './he';

// Typed keys: `t('timeline.title')` autocompletes and a typo fails `npm run typecheck`.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translation };
  }
}
