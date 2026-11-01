import { useTranslation } from 'react-i18next';
import { addDays, JAPAN_TZ, otherZoneTime, type TimeZone } from '../lib/time';

interface IsraelTimeProps {
  /** Date of the start time, in `zone`. */
  date: string;
  start: string | null;
  end?: string | null;
  /** The zone the given times are written in (Japan unless stated). */
  zone?: TimeZone;
  /** `inline` follows a time after a dot; `block` sits on its own line; `bare` has no dot. */
  variant?: 'inline' | 'block' | 'bare';
}

/**
 * The same moment in the other trip zone, in small light text: Israel time for Japan times,
 * Japan time for the (few) times written in Israel time.
 */
export function IsraelTime({
  date,
  start,
  end,
  zone = JAPAN_TZ,
  variant = 'inline',
}: IsraelTimeProps) {
  const { t } = useTranslation();
  if (!start) return null;
  const from = otherZoneTime(date, start, zone);
  // An end time earlier than the start means the range crosses midnight.
  const to = end ? otherZoneTime(end < start ? addDays(date, 1) : date, end, zone) : null;

  let dayNote = '';
  if (from.dayShift < 0)
    dayNote = ` · ${t(to && to.dayShift >= 0 ? 'time.startsPreviousDay' : 'time.previousDay')}`;
  if (from.dayShift > 0) dayNote = ` · ${t('time.nextDay')}`;

  return (
    <span className={`israel-time${variant === 'inline' ? '' : ` israel-time--${variant}`}`}>
      <bdi className="num" dir="ltr">
        {from.clock}
        {to ? `–${to.clock}` : ''}
      </bdi>{' '}
      {t(zone === JAPAN_TZ ? 'time.inIsrael' : 'time.inJapan')}
      {dayNote}
    </span>
  );
}
