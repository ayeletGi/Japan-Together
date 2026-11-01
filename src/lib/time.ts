/** Time zone helpers. Trip times are Japan local time unless an event says otherwise. */

export const JAPAN_TZ = 'Asia/Tokyo';
export const ISRAEL_TZ = 'Asia/Jerusalem';
export type TimeZone = typeof JAPAN_TZ | typeof ISRAEL_TZ;

const JAPAN_OFFSET = '+09:00';
export const DAY_MS = 86_400_000;

const clockFormatters = new Map<string, Intl.DateTimeFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function clockFormatter(tz: string) {
  let formatter = clockFormatters.get(tz);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    clockFormatters.set(tz, formatter);
  }
  return formatter;
}

function dateFormatter(tz: string) {
  let formatter = dateFormatters.get(tz);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dateFormatters.set(tz, formatter);
  }
  return formatter;
}

/** ISO timestamp for a Japan date (YYYY-MM-DD) and clock (HH:MM), for `<time dateTime>`. */
function japanDateTime(date: string, clock: string): string {
  return `${date}T${clock}:00${JAPAN_OFFSET}`;
}

/** Noon in Japan on the given date; a safe instant for date-only formatting. */
export function japanNoon(date: string): Date {
  return new Date(japanDateTime(date, '12:00'));
}

/** Minutes the zone is ahead of UTC at the given instant. */
function offsetMinutes(instant: Date, tz: string): number {
  const local = `${dateFormatter(tz).format(instant)}T${clockFormatter(tz).format(instant)}:00Z`;
  return Math.round((Date.parse(local) - Math.floor(instant.getTime() / 60_000) * 60_000) / 60_000);
}

/** The instant a wall-clock time happens in the given zone (handles Israel summer time). */
export function zonedInstant(date: string, clock: string, tz: TimeZone): Date {
  if (tz === JAPAN_TZ) return new Date(japanDateTime(date, clock));
  const asUtc = Date.parse(`${date}T${clock}:00Z`);
  let instant = asUtc - offsetMinutes(new Date(asUtc), tz) * 60_000;
  instant = asUtc - offsetMinutes(new Date(instant), tz) * 60_000;
  return new Date(instant);
}

/** Wall clock and date of an instant in a zone. */
export function wallClock(instant: Date, tz: string): { clock: string; date: string } {
  return { clock: clockFormatter(tz).format(instant), date: dateFormatter(tz).format(instant) };
}

/** Today's date in Japan (YYYY-MM-DD). */
export function japanToday(now: Date = new Date()): string {
  return dateFormatter(JAPAN_TZ).format(now);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export function toMinutes(clock: string): number {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Minutes after midnight → "HH:MM", wrapping around midnight (1500 → "01:00", -30 → "23:30"). */
export function formatClock(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function addMinutes(clock: string, minutes: number): string {
  return formatClock(toMinutes(clock) + minutes);
}

/**
 * Converts a wall-clock time to the other trip zone (Japan ↔ Israel), with how many calendar days
 * the converted time falls before (-1) or after (+1) the original date.
 */
export function otherZoneTime(date: string, clock: string, from: TimeZone = JAPAN_TZ) {
  const to = from === JAPAN_TZ ? ISRAEL_TZ : JAPAN_TZ;
  const converted = wallClock(zonedInstant(date, clock, from), to);
  return { zone: to, clock: converted.clock, dayShift: daysBetween(date, converted.date) };
}

/** Converts a Japan date + clock to the Israel clock, flagging when it falls on the previous date. */
export function israelTime(date: string, clock: string) {
  const { clock: converted, dayShift } = otherZoneTime(date, clock);
  return { clock: converted, previousDay: dayShift < 0 };
}

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export function japanGreeting(now: Date): { period: GreetingPeriod; face: string } {
  const hour = Number(clockFormatter(JAPAN_TZ).format(now).slice(0, 2));
  if (hour >= 5 && hour < 12) return { period: 'morning', face: '(◕‿◕)' };
  if (hour >= 12 && hour < 17) return { period: 'afternoon', face: '(｡•ᴗ•｡)' };
  if (hour >= 17 && hour < 22) return { period: 'evening', face: '(´｡• ◡ •｡`)' };
  return { period: 'night', face: '(ᴗ˳ᴗ)' };
}
