import { useMemo } from 'react';
import { useLiveVersion } from '../../data/live';
import { getDay } from '../../data/trip';
import { applyPlanEdits, NO_EDITS } from '../itinerary/planEdits';
import { usePlanEdits } from '../itinerary/useDayPlan';
import { mentions } from '../itinerary/suggestions';

const NEVER = () => false;

/**
 * For the chosen Discover day: does a place's name appear in that day's plan (with this phone's
 * edits)? Without a day nothing is "on the route".
 */
export function usePlanMatch(date?: string): (name: string) => boolean {
  const [all] = usePlanEdits();
  const version = useLiveVersion();
  return useMemo(() => {
    const day = date ? getDay(date) : undefined;
    if (!day) return NEVER;
    const stops = applyPlanEdits(day, all[day.date] ?? NO_EDITS);
    return (name: string) => mentions(stops, name);
    // `version`: the day itself changes with the live database.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, date, version]);
}
