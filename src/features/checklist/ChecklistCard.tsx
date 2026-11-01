import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { ProgressBar } from '../../components/ProgressBar';
import { useLiveChanges } from '../../data/live';
import { useNow } from '../../hooks/useNow';
import { useLanguage } from '../../i18n';
import { daysUntilTrip } from '../../lib/tripMode';
import { buildLists, FLIGHT_LIST, listProgress } from '../lists/lists';
import './checklist.css';

/** "Before the flight": days left, a thin bar and the next thing to do. Opens that list. */
export function ChecklistCard({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const flight = buildLists(useLiveChanges(), lang).find((list) => list.id === FLIGHT_LIST);
  const days = daysUntilTrip(useNow());
  const { done, total, next } = listProgress(flight);
  return (
    <a
      href={paths.lists(FLIGHT_LIST)}
      className={`card checklist-card ${className}`.trim()}
      aria-label={t('checklist.open', { done, total })}
    >
      <span className="countdown">
        <b className="num">{days}</b>
        <small>{t('checklist.days', { count: days })}</small>
      </span>
      <span className="checklist-card-text">
        <span className="checklist-card-title">{t('checklist.title')}</span>
        <ProgressBar value={done} max={total} label={t('checklist.title')} thin />
        <span className="muted">
          {next ? t('checklist.next', { item: next.text }) : t('checklist.allDone')} ·{' '}
          <bdi className="num">
            {done}/{total}
          </bdi>
        </span>
      </span>
      <ChevronLeft size={18} className="flip-ltr checklist-chevron" aria-hidden="true" />
    </a>
  );
}
