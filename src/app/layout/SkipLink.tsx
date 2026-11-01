import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

export const MAIN_ID = 'main';

/** Keyboard shortcut to the page content. Focuses <main> directly so hash routing is untouched. */
export function SkipLink() {
  const { t } = useTranslation();
  const skipToMain = (event: MouseEvent) => {
    event.preventDefault();
    const main = document.getElementById(MAIN_ID);
    main?.focus();
    main?.scrollIntoView();
  };
  return (
    <a className="skip-link" href={`#${MAIN_ID}`} onClick={skipToMain}>
      {t('common.skipToContent')}
    </a>
  );
}
