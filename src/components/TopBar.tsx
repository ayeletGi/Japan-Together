import { useTranslation } from 'react-i18next';
import { CatMark } from './icons';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import './TopBar.css';

/**
 * The bar above every main screen: the cat and the app's name (the side rail shows them on
 * desktop), then light/dark and EN side by side.
 */
export function TopBar() {
  const { t } = useTranslation();
  return (
    <div className="top-bar">
      <span className="top-bar-brand">
        <CatMark size={26} />
        <span className="top-bar-name">{t('app.name')}</span>
      </span>
      <span className="top-bar-actions">
        <ThemeToggle />
        <LanguageToggle />
      </span>
    </div>
  );
}
