import { tickets, type TicketEntry } from '../../data/tickets';
import { orderedEvents, sortKey } from '../../data/trip';
import type { TripDay, TripEvent } from '../../data/types';
import type { LeaveInfo } from '../../data/departures';
import { leaveFor } from '../departures/leaves';
import { cleanTitle, eventCategory, eventDisplay, type EventCategory } from './eventDisplay';

/** What kind of thing an added or replacement stop is (it has no source event to say so). */
export type StopKind = Extract<EventCategory, 'food' | 'shop' | 'gym' | 'laundry' | 'activity'>;

/** One stop of a day as Today shows it: a source event, possibly edited, or one we added. */
export interface PlanStop {
  id: string;
  date: string;
  /** Japan clock shown for the stop; null when it has no fixed time. */
  time: string | null;
  /** Minutes after midnight used for ordering and progress (an estimate for untimed stops). */
  minutes: number;
  title: string;
  /** The place or thing itself ("teamLab Planets TOKYO"), for "to …" lines and stamp labels. */
  name: string;
  note: string;
  category: EventCategory;
  /** The source event, if the stop comes from the plan (and was not replaced). */
  event?: TripEvent;
  pinned: boolean;
  ticket?: TicketEntry;
  leave?: LeaveInfo;
  /** Set when the stop differs from the plan on this phone. */
  edit?: 'moved' | 'replaced' | 'added';
}

/** The booking behind a stop, if it has one (hotel stays are not tickets). */
function ticketFor(eventId: string): TicketEntry | undefined {
  return tickets.find(
    (ticket) => ticket.category !== 'hotels' && ticket.eventIds.includes(eventId),
  );
}

const FIXED_KINDS = new Set(['flight', 'train', 'ticket', 'shabbat']);

/**
 * A stop is pinned (📌, never moved or replaced) when it is booked: it has a ticket, or a fixed
 * booking time (flights, shinkansen, timed entries, the kimono, the spa, Shabbat at Chabad).
 * Hotel check-in and check-out times are estimates, so hotels can move.
 */
export function isPinned(event: TripEvent): boolean {
  if (event.status !== 'confirmed') return false;
  if (FIXED_KINDS.has(event.kind) || ticketFor(event.id)) return true;
  return event.time !== null && event.kind !== 'hotel';
}

/** "teamLab Planets TOKYO — חלון כניסה" → "teamLab Planets TOKYO". */
const stopName = (event: TripEvent) => cleanTitle(event.title).split(' — ')[0].trim();

/** The plan's own stops for a day, in the order the day is lived. */
export function baseStops(day: TripDay): PlanStop[] {
  return orderedEvents(day).map((event) => {
    const display = eventDisplay(event);
    return {
      id: event.id,
      date: day.date,
      time: event.time,
      minutes: sortKey(event),
      title: display.title,
      name: stopName(event),
      note: display.description,
      category: eventCategory(event),
      event,
      pinned: isPinned(event),
      ticket: ticketFor(event.id),
      leave: leaveFor(event.id),
    };
  });
}
