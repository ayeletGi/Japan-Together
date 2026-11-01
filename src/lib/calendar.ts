import { journeyFor } from '../data/journeys';
import { eventTimeZone } from '../data/trip';
import type { TripEvent } from '../data/types';
import { addDays, addMinutes, JAPAN_TZ, zonedInstant } from './time';

/** "20261104T010000Z" — UTC basic format used by Google Calendar and ICS. */
function utcStamp(instant: Date): string {
  return instant
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

const compactDate = (date: string) => date.replace(/-/g, '');

/** An hour, for timed events the plan gives no end. */
const DEFAULT_LENGTH = 60;

/**
 * When a timed event ends: its own end, or an hour after it starts. An end earlier than the start
 * is past midnight, on the next date.
 */
export function eventEnd(event: Pick<TripEvent, 'date' | 'end'> & { time: string }) {
  const clock = event.end ?? addMinutes(event.time, DEFAULT_LENGTH);
  return { date: clock < event.time ? addDays(event.date, 1) : event.date, clock };
}

/** Start and end of an event as calendar values; untimed events become all-day entries. */
export function calendarSpan(event: TripEvent): { start: string; end: string; allDay: boolean } {
  const journey = journeyFor(event.id);
  if (journey) {
    return {
      start: utcStamp(zonedInstant(journey.depart.date, journey.depart.clock, journey.depart.zone)),
      end: utcStamp(zonedInstant(journey.arrive.date, journey.arrive.clock, journey.arrive.zone)),
      allDay: false,
    };
  }
  if (!event.time) {
    return {
      start: compactDate(event.date),
      end: compactDate(addDays(event.date, 1)),
      allDay: true,
    };
  }
  const zone = eventTimeZone(event);
  const end = eventEnd({ ...event, time: event.time });
  return {
    start: utcStamp(zonedInstant(event.date, event.time, zone)),
    end: utcStamp(zonedInstant(end.date, end.clock, zone)),
    allDay: false,
  };
}

/** Plain text for calendar descriptions: strips the source's markdown emphasis. */
const plain = (text: string) => text.replace(/\*\*/g, '');

/** A Google Calendar "add event" link. Opens a form; nothing is saved without the user's click. */
export function googleCalendarUrl(event: TripEvent): string {
  const span = calendarSpan(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: plain(event.title),
    dates: `${span.start}/${span.end}`,
    details: plain(event.note),
    location: event.place,
    ctz: JAPAN_TZ,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeIcs(text: string): string {
  return plain(text)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * An ICS calendar of the given events. UIDs are stable per event, so importing the file again
 * updates the same entries instead of duplicating them in most calendar apps.
 */
export function buildIcs(events: TripEvent[], stamp = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Japan Together//Trip 2026//HE',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Japan Together 2026',
  ];
  for (const event of events) {
    const span = calendarSpan(event);
    lines.push(
      'BEGIN:VEVENT',
      `UID:japan-together-${event.id}@japan-together`,
      `DTSTAMP:${utcStamp(stamp)}`,
      span.allDay ? `DTSTART;VALUE=DATE:${span.start}` : `DTSTART:${span.start}`,
      span.allDay ? `DTEND;VALUE=DATE:${span.end}` : `DTEND:${span.end}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `LOCATION:${escapeIcs(event.place)}`,
      `DESCRIPTION:${escapeIcs(event.note)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/** Confirmed bookings worth putting in a calendar (original plan rules: skip untimed hotel entries). */
export function calendarEvents(events: TripEvent[]): TripEvent[] {
  return events.filter(
    (event) =>
      event.status === 'confirmed' &&
      !event.calendarDisabled &&
      !(event.kind === 'hotel' && !event.time),
  );
}
