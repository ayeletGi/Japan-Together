import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { applyTheme, effectiveTheme, NO_THEME, THEME_KEY, type Theme } from '../app/theme';
import { useLocalState } from '../hooks/useLocalState';

/** Light ↔ dark. Follows the phone until tapped; the choice is remembered on this device. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const [saved, setSaved] = useLocalState<Theme | null>(THEME_KEY, NO_THEME);
  const [, setSystemChanged] = useState(0);
  const theme = effectiveTheme(saved);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  useEffect(() => applyTheme(saved), [saved]);

  // While following the phone, redraw the icon when the phone switches.
  useEffect(() => {
    if (saved) return;
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    const update = () => setSystemChanged((count) => count + 1);
    query?.addEventListener?.('change', update);
    return () => query?.removeEventListener?.('change', update);
  }, [saved]);

  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button
      type="button"
      className="quick-button quick-button--icon"
      aria-label={t(`theme.to.${next}`)}
      title={t(`theme.to.${next}`)}
      onClick={() => setSaved(next)}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}
