import { TRIP } from '../data/trip';
import { DAY_MS, ISRAEL_TZ, zonedInstant } from './time';

/** The trip starts at midnight Israel time on 2 November (the day of the evening flight). */
const TRIP_START = zonedInstant(TRIP.start, '00:00', ISRAEL_TZ);

/**
 * Trip mode: from the start of the trip everything follows the real Japan clock. Before it, the
 * cat walks when a stop is tapped and the "before the flight" checklist is shown.
 */
export const isTripMode = (now: Date): boolean => now.getTime() >= TRIP_START.getTime();

/** Whole days left until the trip starts (0 once it has). */
export const daysUntilTrip = (now: Date): number =>
  Math.max(0, Math.ceil((TRIP_START.getTime() - now.getTime()) / DAY_MS));
