import { describe, expect, it } from 'vitest';
import { dayOfMonth, formatDayMonth, formatFullDate, formatShortWeekday } from '../src/lib/dates';
import {
  addDays,
  addMinutes,
  daysBetween,
  formatClock,
  israelTime,
  japanGreeting,
  toMinutes,
} from '../src/lib/time';

describe('israelTime', () => {
  it('converts trip hours to Israel time using the destination time zone', () => {
    expect(israelTime('2037-11-04', '10:00')).toEqual({ clock: '03:00', previousDay: false });
    expect(israelTime('2037-11-04', '21:00')).toEqual({ clock: '14:00', previousDay: false });
  });

  it('handles summer time and crossing into the previous date', () => {
    expect(israelTime('2026-07-04', '10:00')).toEqual({ clock: '04:00', previousDay: false });
    expect(israelTime('2037-11-04', '05:00')).toEqual({ clock: '22:00', previousDay: true });
  });
});

describe('date arithmetic', () => {
  it('adds days across month boundaries and measures gaps', () => {
    expect(addDays('2037-10-31', 2)).toBe('2037-11-02');
    expect(addDays('2037-11-02', -1)).toBe('2037-11-01');
    expect(daysBetween('2037-11-02', '2037-11-18')).toBe(16);
    expect(toMinutes('08:45')).toBe(525);
  });
});

describe('clock arithmetic', () => {
  it('formats minutes as HH:MM and wraps around midnight both ways', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(9 * 60 + 5)).toBe('09:05');
    expect(formatClock(25 * 60)).toBe('01:00');
    expect(formatClock(-30)).toBe('23:30');
    expect(addMinutes('23:30', 60)).toBe('00:30');
    expect(addMinutes('00:15', -30)).toBe('23:45');
  });
});

describe('Hebrew date labels', () => {
  it('formats trip dates the way the UI shows them', () => {
    expect(formatFullDate('2037-11-04')).toBe('יום רביעי, 4 בנובמבר 2037');
    expect(formatDayMonth('2037-11-04')).toBe('4 בנובמבר');
    expect(formatShortWeekday('2037-11-07')).toBe('שבת');
    expect(dayOfMonth('2037-11-04')).toBe(4);
  });
});

describe('English date labels', () => {
  it('formats the same dates in English', () => {
    expect(formatDayMonth('2037-11-04', 'en')).toBe('4 November');
    expect(formatShortWeekday('2037-11-07', 'en')).toBe('Sat');
    expect(formatFullDate('2037-11-04', 'en')).toContain('Wednesday');
  });
});

describe('japanGreeting', () => {
  it('follows the hour in Japan, not the device time zone', () => {
    expect(japanGreeting(new Date('2037-11-04T08:00:00+09:00')).period).toBe('morning');
    expect(japanGreeting(new Date('2037-11-04T23:30:00+09:00')).period).toBe('night');
  });
});
