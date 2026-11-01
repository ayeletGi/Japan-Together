import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TripCountdown } from '../../components/TripCountdown';
import { paths } from '../../app/router';
import { getDay, tripDates } from '../../data/trip';
import { placeName, useLanguage } from '../../i18n';
import { dayOfMonth, formatDayMonth, formatWeekdayLetter } from '../../lib/dates';

/**
 * All 17 days as a row of chips; the chosen one is pink and scrolled into view. `all` adds a
 * first "every day" chip (Discover), chosen when no day is. `countdown` (Today) puts a small
 * "in 17 days" above the first day's chip until the trip.
 */
export function DayChips({
  selected,
  href = paths.day,
  label,
  all,
  countdown,
}: {
  selected?: string;
  href?: (date: string) => string;
  label?: string;
  all?: { href: string; label: string };
  countdown?: boolean;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const row = useRef<HTMLElement>(null);

  useEffect(() => {
    row.current
      ?.querySelector('[aria-current="date"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selected]);

  return (
    <nav className="day-chips" aria-label={label ?? t('today.pickDay')} ref={row}>
      {all && (
        <a
          href={all.href}
          className="day-chip day-chip--all"
          aria-current={selected ? undefined : 'date'}
        >
          {all.label}
        </a>
      )}
      {tripDates.map((date, index) => (
        <a
          key={date}
          href={href(date)}
          className="day-chip"
          aria-current={date === selected ? 'date' : undefined}
          aria-label={`${formatDayMonth(date, lang)} · ${placeName(getDay(date)?.city ?? '', t)}`}
        >
          <span>{formatWeekdayLetter(date, lang)}</span>
          <b className="num">{dayOfMonth(date)}</b>
          {countdown && index === 0 && <TripCountdown />}
        </a>
      ))}
    </nav>
  );
}
