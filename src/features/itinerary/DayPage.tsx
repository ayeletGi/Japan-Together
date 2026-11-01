import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { useNow } from '../../hooks/useNow';
import { isTripMode } from '../../lib/tripMode';
import { DayChips } from './DayChips';
import { DayHero } from './DayHero';
import { DayPlan } from './DayPlan';
import { NextUpCard } from './NextUpCard';
import { currentMinutes, dayClock, nextUp, reachedCount } from './progress';
import { catShare } from './rallyGeometry';
import { StampRally } from './StampRally';
import { useDayPlan } from './useDayPlan';
import './today.css';

/**
 * Today: the hero, the day chips, the stamp rally, the day's plan (stamped as the cat walks) and
 * the next-up card.
 * Before the trip a tapped stop on the map walks the cat there (a second tap opens it) and a tapped
 * stamp collects it; from 2 November the cat follows the Japan clock, refreshed every minute.
 */
export function DayPage({ date }: { date: string }) {
  const { t } = useTranslation();
  const { open } = useSheet();
  const now = useNow();
  const trip = isTripMode(now);
  const { day, stops } = useDayPlan(date);

  const [walk, setWalk] = useState({ date, reached: 0 });
  const walked = walk.date === date ? walk.reached : 0;
  const clock = dayClock(date, now, walked);
  const reached = reachedCount(stops, clock);

  const tapStop = (index: number) => {
    // The cat stands on the next stop to visit, so standing on this one means the stamps before it.
    if (trip || reached === index) open({ kind: 'stop', date, stopId: stops[index].id });
    else setWalk({ date, reached: index });
  };

  return (
    <>
      <DayHero day={day} now={now} trip={trip} />
      <div className="wrap">
        <div className="today-chips">
          <DayChips selected={date} countdown />
        </div>
        {!trip && (
          <p className="trip-hint">
            <MapPin size={14} aria-hidden="true" />
            <span>{t('today.hint')}</span>
          </p>
        )}
        <div className="today-grid">
          <StampRally
            date={date}
            count={stops.length}
            reached={reached}
            dayTitle={day.title}
            onStop={tapStop}
            onHome={trip ? undefined : () => setWalk({ date, reached: 0 })}
          />
          <DayPlan
            key={date}
            date={date}
            now={currentMinutes(stops, clock)}
            reached={reached}
            onStamp={trip ? undefined : (index) => setWalk({ date, reached: index + 1 })}
          />
          <NextUpCard
            date={date}
            next={nextUp(stops, clock, date, now)}
            total={stops.length}
            share={catShare(stops.length, reached)}
          />
        </div>
      </div>
    </>
  );
}
