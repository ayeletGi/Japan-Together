import { dayTimeZone } from '../../data/trip';
import { toMinutes, wallClock, zonedInstant } from '../../lib/time';
import { isTripMode } from '../../lib/tripMode';
import type { PlanStop } from './stops';

/**
 * Where a day stands. Before the trip the cat walks to whichever stop was tapped (`walk`). During
 * the trip the real Japan clock decides: earlier days are done, later ones not started, and today
 * follows the minute.
 */
export type DayClock =
  | { kind: 'walk'; reached: number }
  | { kind: 'clock'; minutes: number }
  | { kind: 'past' }
  | { kind: 'future' };

export function dayClock(date: string, now: Date, walked: number): DayClock {
  if (!isTripMode(now)) return { kind: 'walk', reached: walked };
  // Each day by its own clock: the departure day by Israel's, the rest by Japan's.
  const local = wallClock(now, dayTimeZone(date));
  if (date < local.date) return { kind: 'past' };
  if (date > local.date) return { kind: 'future' };
  return { kind: 'clock', minutes: toMinutes(local.clock) };
}

/** How many stops the cat has reached (and stamped). */
export function reachedCount(stops: PlanStop[], clock: DayClock): number {
  switch (clock.kind) {
    case 'walk':
      return Math.min(Math.max(clock.reached, 0), stops.length);
    case 'past':
      return stops.length;
    case 'future':
      return 0;
    case 'clock':
      return stops.filter((stop) => stop.minutes <= clock.minutes).length;
  }
}

/** The day's start before the first stop, when walking: 06:00. */
const MORNING = 6 * 60;

/**
 * "Now" in minutes for countdowns: the real clock today, or, when walking before the trip, the
 * time of the stop the cat stands at. Null on other days, where a countdown would mislead.
 */
export function currentMinutes(stops: PlanStop[], clock: DayClock): number | null {
  if (clock.kind === 'clock') return clock.minutes;
  if (clock.kind !== 'walk') return null;
  const reached = reachedCount(stops, clock);
  return reached ? stops[reached - 1].minutes : MORNING;
}

export type StopState = 'past' | 'now' | 'upcoming';

/** Whether a stop is behind us, happening, or still ahead (a stop lasts until the next one). */
export function stopState(stops: PlanStop[], index: number, now: number | null): StopState {
  if (now === null) return 'upcoming';
  const start = stops[index].minutes;
  const end = stops[index + 1]?.minutes ?? start + 90;
  if (now >= end) return 'past';
  if (now >= start) return 'now';
  return 'upcoming';
}

export type NextUp =
  | { kind: 'leave'; stop: PlanStop; index: number; inMinutes: number }
  | { kind: 'stop'; stop: PlanStop; index: number; inMinutes: number | null }
  | { kind: 'done' };

/**
 * What the next-up card shows: time to leave for the next stop while it is not yet time to go,
 * otherwise the next stop and how long until it, or "day complete".
 */
export function nextUp(stops: PlanStop[], clock: DayClock, date: string, now: Date): NextUp {
  const index = reachedCount(stops, clock);
  const stop = stops[index];
  if (!stop) return { kind: 'done' };
  // Countdowns use the real date and time, so a stop weeks away says so.
  const midnight = zonedInstant(date, '00:00', dayTimeZone(date)).getTime();
  const minutesUntil = (minutes: number) =>
    Math.ceil((midnight + minutes * 60_000 - now.getTime()) / 60_000);
  if (stop.leave) {
    const untilLeave = minutesUntil(toMinutes(stop.leave.leave));
    if (untilLeave > 0) return { kind: 'leave', stop, index, inMinutes: untilLeave };
  }
  const until = minutesUntil(stop.minutes);
  return { kind: 'stop', stop, index, inMinutes: until > 0 ? until : null };
}

/** 165 → { days: 0, hours: 2, minutes: 45 }, for "בעוד 2 ש׳ ו־45 דק׳". */
export const splitDuration = (total: number) => ({
  days: Math.floor(total / 1440),
  hours: Math.floor((total % 1440) / 60),
  minutes: total % 60,
});
