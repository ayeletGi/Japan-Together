import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useNow } from '../hooks/useNow';
import { daysUntilTrip } from '../lib/tripMode';
import './TripCountdown.css';

/**
 * "In 17 days", on a gentle curve right on top of the first day's chip. Gone once
 * the trip day arrives.
 */
export function TripCountdown() {
  const { t } = useTranslation();
  const arc = useId();
  const days = daysUntilTrip(useNow());
  if (days <= 0) return null;
  return (
    <svg className="trip-countdown" viewBox="0 0 70 12" aria-hidden="true">
      <path id={arc} d="M0 11 Q35 1 70 11" fill="none" />
      <text>
        <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">
          {t('countdown.days', { count: days })}
        </textPath>
      </text>
    </svg>
  );
}
