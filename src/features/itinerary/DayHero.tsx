import { useTranslation } from 'react-i18next';
import { DayGreeting } from '../../components/DayGreeting';
import { TRIP } from '../../data/trip';
import type { TripDay } from '../../data/types';
import { placeName, useLanguage } from '../../i18n';
import { formatDayMonth } from '../../lib/dates';
import { daysBetween, JAPAN_TZ, wallClock } from '../../lib/time';
import { WeatherBadge } from '../weather/WeatherBadge';
import { Skyline } from './Skyline';

/**
 * The sky card at the top of Today: greeting, "day N of 17", the city and date (and the Japan
 * clock once the trip has started), and the weather. Text sits in the open sky above the skyline.
 */
export function DayHero({ day, now, trip }: { day: TripDay; now: Date; trip: boolean }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const number = daysBetween(TRIP.start, day.date) + 1;
  return (
    <section className="day-hero" aria-labelledby="day-title">
      <Skyline />
      <div className="day-hero-top">
        <div className="day-hero-text">
          <DayGreeting now={now} />
          <h1 id="day-title">{t('today.dayOf', { number, total: TRIP.dayCount })}</h1>
          <p className="day-hero-place">
            <bdi>{placeName(day.city, t)}</bdi> · <bdi>{formatDayMonth(day.date, lang)}</bdi>
            {trip && (
              <>
                {' · '}
                <time className="num" dir="ltr">
                  {wallClock(now, JAPAN_TZ).clock}
                </time>
              </>
            )}
          </p>
        </div>
        <WeatherBadge date={day.date} />
      </div>
    </section>
  );
}
