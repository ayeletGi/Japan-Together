import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lastDay } from '../app/lastDay';
import { paths } from '../app/router';
import './BackLink.css';

/** Back to a day (or the day last open), or to any other screen with its own label. */
export function BackLink({ date, href, label }: { date?: string; href?: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <a className="back-link" href={href ?? paths.day(date ?? lastDay())}>
      <ArrowRight size={18} className="flip-ltr" aria-hidden="true" />
      {label ?? t('common.backToDay')}
    </a>
  );
}
