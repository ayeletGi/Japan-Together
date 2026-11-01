import type { TripDay } from '../../data/types';
import { formatClock, toMinutes } from '../../lib/time';
import { baseStops, type PlanStop, type StopKind } from './stops';

/** A stop that takes the place of a planned one, or is added to the day. */
export interface CustomStop {
  title: string;
  note: string;
  kind: StopKind;
}

export interface AddedStop extends CustomStop {
  id: string;
  time: string;
}

/**
 * Changes made to one day's plan on this phone only, before edits were shared through the live
 * database. Nothing makes new ones any more; old ones still show (`applyPlanEdits`) until the
 * day's "clear" button removes them.
 */
export interface DayEdits {
  /** New clock per stop id. */
  moved: Record<string, string>;
  replaced: Record<string, CustomStop>;
  removed: string[];
  added: AddedStop[];
}

/** Edits per date (YYYY-MM-DD). */
export type PlanEdits = Record<string, DayEdits>;

export const NO_EDITS: DayEdits = { moved: {}, replaced: {}, removed: [], added: [] };

const LAST_SLOT = 23 * 60 + 50;
const clock = (minutes: number) => formatClock(Math.min(LAST_SLOT, Math.max(0, minutes)));

/** Moves a stop to a new clock; its leave time moves by the same amount. */
function moveTo(stop: PlanStop, time: string): PlanStop {
  const delta = toMinutes(time) - stop.minutes;
  const shift = (value: string) => clock(toMinutes(value) + delta);
  return {
    ...stop,
    time,
    minutes: toMinutes(time),
    edit: stop.edit ?? 'moved',
    leave: stop.leave && {
      ...stop.leave,
      leave: shift(stop.leave.leave),
      arriveBy: shift(stop.leave.arriveBy),
    },
  };
}

function customStop(
  date: string,
  id: string,
  custom: CustomStop,
  time: string | null,
  minutes: number,
): PlanStop {
  return {
    id,
    date,
    time,
    minutes,
    title: custom.title,
    name: custom.title,
    note: custom.note,
    category: custom.kind,
    pinned: false,
  };
}

/** Earliest first; stops at the same minute keep their plan order. */
const byTime = (stops: PlanStop[]) =>
  stops
    .map((stop, index) => ({ stop, index }))
    .sort((a, b) => a.stop.minutes - b.stop.minutes || a.index - b.index)
    .map(({ stop }) => stop);

/** The day as shown: the plan's stops with this phone's edits applied, in time order. */
export function applyPlanEdits(day: TripDay, edits: DayEdits = NO_EDITS): PlanStop[] {
  const removed = new Set(edits.removed);
  const stops = baseStops(day)
    .filter((stop) => !removed.has(stop.id))
    .map((stop) => {
      if (stop.pinned) return stop;
      const replacement = edits.replaced[stop.id];
      const base = replacement
        ? {
            ...customStop(day.date, stop.id, replacement, stop.time, stop.minutes),
            edit: 'replaced' as const,
          }
        : stop;
      const moved = edits.moved[stop.id];
      return moved ? moveTo(base, moved) : base;
    });
  const added = edits.added.map((stop) => {
    const time = edits.moved[stop.id] ?? stop.time;
    return {
      ...customStop(day.date, stop.id, stop, time, toMinutes(time)),
      edit: 'added' as const,
    };
  });
  return byTime([...stops, ...added]);
}

/** Whether a day differs from the plan on this phone. */
export const hasEdits = (edits: DayEdits | undefined): boolean =>
  !!edits &&
  (Object.keys(edits.moved).length > 0 ||
    Object.keys(edits.replaced).length > 0 ||
    edits.removed.length > 0 ||
    edits.added.length > 0);
