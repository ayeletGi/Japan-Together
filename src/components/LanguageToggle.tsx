import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n';

/** Switches between Hebrew (RTL) and English (LTR); the choice is remembered on this device. */
export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const lang = useLanguage();
  const next = lang === 'he' ? 'en' : 'he';
  return (
    <button
      type="button"
      className="quick-button"
      lang={next}
      aria-label={t('language.toggleLabel')}
      onClick={() => void i18n.changeLanguage(next)}
    >
      <Languages size={16} aria-hidden="true" />
      {t('language.toggle')}
    </button>
  );
}
