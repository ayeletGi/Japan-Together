import { Camera, Check, Plane, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScreenshotMode } from '../../app/screenshotContext';
import { useSheet } from '../../app/sheetContext';
import { useToast } from '../../app/toastContext';
import { IsraelTime } from '../../components/IsraelTime';
import { Pill } from '../../components/Pill';
import { homebound, outbound } from '../../data/journeys';
import { TRIP, tripDates, tripToday } from '../../data/trip';
import { useNow } from '../../hooks/useNow';
import { isTripMode } from '../../lib/tripMode';
import { stampedDays } from './calendar';
import { CalendarGrid } from './CalendarGrid';
import { HotelList } from './HotelList';
import { useStampBook } from './useStampBook';
import './schedule.css';

/** "2037-11-02" → "2.11" */
const dotted = (date: string) => `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;

/**
 * The whole trip on one screen to screenshot and send: the dates and both flights, the calendar
 * with city ribbons and hanko stamps, where we sleep, and the stamp book count.
 */
export function SchedulePage({ focus }: { focus?: 'hotels' }) {
  const { t } = useTranslation();
  const toast = useToast();
  const screenshot = useScreenshotMode();
  const { open } = useSheet();
  const now = useNow();
  const [book, setBook] = useStampBook();
  const [fresh, setFresh] = useState<string | null>(null);
  const stamped = stampedDays(book, now);
  const today = isTripMode(now) ? tripToday(now) : null;

  useEffect(() => {
    if (focus === 'hotels') document.getElementById('hotels')?.scrollIntoView();
  }, [focus]);

  const toggle = (date: string) => {
    const on = !book.includes(date);
    setBook(on ? [...book, date] : book.filter((day) => day !== date));
    setFresh(on ? date : null);
  };

  return (
    <div className="wrap schedule">
      <header className="schedule-head">
        <div>
          <p className="schedule-kicker">
            <bdi dir="ltr">
              {Number(TRIP.start.slice(8))}–{Number(TRIP.end.slice(8))}
            </bdi>{' '}
            {t('schedule.kicker', { count: tripDates.length })}
          </p>
          <h1>{t('schedule.title')}</h1>
        </div>
        <div className="schedule-flights">
          <span>
            <Plane size={14} aria-hidden="true" />
            {t('schedule.outbound', { number: outbound.number })} ·{' '}
            <bdi dir="ltr">{dotted(outbound.depart.date)}</bdi> ·{' '}
            <b className="num">{outbound.depart.clock}</b> {t('time.israelClock')}
          </span>
          <span>
            <Plane size={14} className="flip-ltr schedule-plane-back" aria-hidden="true" />
            {t('schedule.homebound', { number: homebound.number })} ·{' '}
            <bdi dir="ltr">{dotted(homebound.depart.date)}</bdi> ·{' '}
            <b className="num">{homebound.depart.clock}</b> {t('time.japanClock')}
            <IsraelTime date={homebound.depart.date} start={homebound.depart.clock} />
          </span>
        </div>
      </header>

      <CalendarGrid stamped={stamped} today={today} fresh={fresh} onToggle={toggle} />
      <HotelList />

      <div className="schedule-foot">
        <Pill tone="pink" icon={<Check size={13} aria-hidden="true" />}>
          <span className="num">
            {t('schedule.book', { count: stamped.size, total: tripDates.length })}
          </span>
        </Pill>
        {!screenshot.on && (
          <button type="button" className="btn btn--small" onClick={() => open({ kind: 'export' })}>
            <Share2 size={15} aria-hidden="true" />
            {t('export.button')}
          </button>
        )}
        {!screenshot.on && (
          <button
            type="button"
            className="btn btn--small"
            onClick={() => {
              screenshot.set(true);
              window.scrollTo({ top: 0 });
              toast(t('schedule.screenshotToast'));
            }}
          >
            <Camera size={15} aria-hidden="true" />
            {t('schedule.screenshot')}
          </button>
        )}
      </div>
      <p className="small-note">{t('schedule.savedHere')}</p>
    </div>
  );
}
