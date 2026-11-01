import { Check, Footprints, MapPin } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { useSheet } from '../../app/sheetContext';
import { IsraelTime } from '../../components/IsraelTime';
import { Pill } from '../../components/Pill';
import { useStampBook } from '../schedule/useStampBook';
import { CatFace } from './CatFace';
import { splitDuration, type NextUp } from './progress';

/** "בעוד 2 ש׳ ו־45 דק׳" */
function useIn() {
  const { t } = useTranslation();
  return (total: number) => {
    const { days, hours, minutes } = splitDuration(total);
    if (days === 1) return hours ? t('nextUp.inDayHours', { hours }) : t('nextUp.inDay');
    if (days) return t('nextUp.inDays', { days });
    if (!hours) return t('nextUp.inMinutes', { minutes });
    if (!minutes) return t('nextUp.inHours', { hours });
    return t('nextUp.inHoursMinutes', { hours, minutes });
  };
}

/** The share of the route walked, for the edge bar and its cat. */
const catAt = (share: number) => ({ '--cat-at': share }) as CSSProperties;

/** A small cat in a bead on the card's edge, as far down it as the rally cat is along its route. */
function EdgeCat() {
  return (
    <span className="next-up-cat" aria-hidden="true">
      <svg viewBox="0 0 34 34">
        <CatFace />
      </svg>
    </span>
  );
}

/** When every stop is stamped: the day is done and can go into the stamp book. */
function DayComplete({ date, count }: { date: string; count: number }) {
  const { t } = useTranslation();
  const [book, setBook] = useStampBook();
  const inBook = book.includes(date);
  return (
    <div className="next-up next-up--done" style={catAt(1)}>
      <EdgeCat />
      <span className="next-up-icon">
        <Check size={22} aria-hidden="true" />
      </span>
      <span className="next-up-text">
        <strong>{t('nextUp.complete', { count })}</strong>
        <small>{t('nextUp.catSleeps')}</small>
      </span>
      {inBook ? (
        <a className="pill tone-card" href={paths.schedule()}>
          {t('nextUp.inBook')}
        </a>
      ) : (
        <button type="button" className="pill tone-card" onClick={() => setBook([...book, date])}>
          {t('nextUp.addToBook')}
        </button>
      )}
    </div>
  );
}

/**
 * The card under the rally: when to leave for the next stop (while it is not yet time to go),
 * else the next stop and how long until it. Tapping opens the stop sheet.
 */
export function NextUpCard({
  date,
  next,
  total,
  share,
}: {
  date: string;
  next: NextUp;
  total: number;
  /** How far along the route the rally cat is, 0–1. */
  share: number;
}) {
  const { t } = useTranslation();
  const { open } = useSheet();
  const inTime = useIn();
  if (next.kind === 'done') return <DayComplete date={date} count={total} />;
  const { stop } = next;
  const openStop = () => open({ kind: 'stop', date, stopId: stop.id });

  if (next.kind === 'leave') {
    const leave = stop.leave!;
    const fromHotel = leave.from === 'hotel' || leave.from === 'shuttle';
    return (
      <button
        type="button"
        className="next-up next-up--leave"
        style={catAt(share)}
        onClick={openStop}
      >
        <EdgeCat />
        <span className="next-up-icon">
          <Footprints size={22} aria-hidden="true" />
        </span>
        <span className="next-up-text">
          <small className="next-up-kicker">
            {t(fromHotel ? 'nextUp.leaveHotelIn' : 'nextUp.leaveIn', {
              in: inTime(next.inMinutes),
            })}
            {leave.estimate && ` ${t('leave.estimate')}`}
          </small>
          <strong>
            <span className="num">{leave.leave}</span> · {t('nextUp.to')}
            <bdi>{stop.name}</bdi>
          </strong>
          <small>
            <IsraelTime date={date} start={leave.leave} variant="bare" /> · {t('nextUp.arriveBy')}{' '}
            <span className="num">{leave.arriveBy}</span>
            <IsraelTime date={date} start={leave.arriveBy} />
          </small>
        </span>
        <Pill tone="card">{t('nextUp.route')}</Pill>
      </button>
    );
  }

  return (
    <button type="button" className="next-up" style={catAt(share)} onClick={openStop}>
      <EdgeCat />
      <span className="next-up-icon">
        <MapPin size={22} aria-hidden="true" />
      </span>
      <span className="next-up-text">
        <small className="next-up-kicker">
          {next.inMinutes === null
            ? t('nextUp.next')
            : t('nextUp.nextIn', { in: inTime(next.inMinutes) })}
        </small>
        <strong>
          <bdi>{stop.title}</bdi>
        </strong>
        {stop.time && (
          <small>
            <span className="num">{stop.time}</span>
            <IsraelTime date={date} start={stop.time} />
          </small>
        )}
      </span>
      <Pill tone="card">{t('nextUp.details')}</Pill>
    </button>
  );
}
