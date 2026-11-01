import type { CityId } from '../../data/cities';
import { hotelList } from '../../data/hotels';
import { TRIP, tripDates, tripToday } from '../../data/trip';
import { addDays } from '../../lib/time';
import { isTripMode } from '../../lib/tripMode';

/** November 2026 starts on a Sunday; the trip fits in its first three weeks. */
const FIRST_SUNDAY = '2037-11-01';
const WEEKS = 3;

/** Sunday-first weeks of dates (YYYY-MM-DD) covering the trip. */
export function calendarWeeks(): string[][] {
  return Array.from({ length: WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(FIRST_SUNDAY, week * 7 + day)),
  );
}

const dayNumber = (date: string) => Number(date.slice(8, 10));

/**
 * Where we sleep, as stretches of the calendar in half days: a stay runs from the middle of its
 * check-in day to the middle of its check-out day, so moving days show both cities. The flight
 * days before and after are their own stretches.
 */
export interface CitySpan {
  city: CityId;
  /** Day of the month (with .5 for midday). */
  start: number;
  end: number;
}

export function citySpans(): CitySpan[] {
  const stays = hotelList.map((hotel) => ({
    city: hotel.area,
    start: dayNumber(hotel.checkIn) + 0.5,
    end: dayNumber(hotel.checkOut) + 0.5,
  }));
  return [
    { city: 'flight', start: dayNumber(TRIP.start), end: stays[0].start },
    ...stays,
    { city: 'flight', start: stays[stays.length - 1].end, end: dayNumber(TRIP.end) + 1 },
  ];
}

/** A ribbon piece inside one week row of a 14-column grid (two columns per day). */
export interface Ribbon {
  city: CityId;
  /** CSS grid lines, 1-based. */
  columnStart: number;
  columnEnd: number;
  /** Rounded ends only where the stay really starts or ends, not where the week cuts it. */
  roundStart: boolean;
  roundEnd: boolean;
  /** Long enough (a day or more) to carry the city name. */
  labelled: boolean;
}

/** The city ribbons under one week, given that week's first date. */
export function weekRibbons(weekStart: string, spans: CitySpan[] = citySpans()): Ribbon[] {
  const base = dayNumber(weekStart);
  return spans.flatMap((span) => {
    const from = Math.max(span.start, base);
    const to = Math.min(span.end, base + 7);
    if (to <= from) return [];
    return [
      {
        city: span.city,
        columnStart: Math.round((from - base) * 2) + 1,
        columnEnd: Math.round((to - base) * 2) + 1,
        roundStart: from === span.start,
        roundEnd: to === span.end,
        labelled: to - from >= 1,
      },
    ];
  });
}

/** The city we wake up in on a date (the stretch covering its morning). */
export function homeCity(date: string, spans: CitySpan[] = citySpans()): CityId | undefined {
  const morning = dayNumber(date) + 0.25;
  return spans.find((span) => morning >= span.start && morning < span.end)?.city;
}

/**
 * Days in the stamp book: the ones stamped on this phone, plus, during the trip, every day that
 * has already passed in Japan.
 */
export function stampedDays(book: readonly string[], now: Date): Set<string> {
  const stamped = new Set(book.filter((date) => tripDates.includes(date)));
  if (isTripMode(now)) {
    const today = tripToday(now);
    for (const date of tripDates) if (date < today) stamped.add(date);
  }
  return stamped;
}
