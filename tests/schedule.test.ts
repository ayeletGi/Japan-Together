import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  calendarWeeks,
  citySpans,
  homeCity,
  stampedDays,
  weekRibbons,
} from '../src/features/schedule/calendar';
import { calendarDays } from '../src/features/schedule/calendarDays';
import { SchedulePage } from '../src/features/schedule/SchedulePage';
import { tripDates } from '../src/data/trip';
import '../src/i18n';

describe('trip calendar', () => {
  it('has three Sunday-first weeks and a cell for every trip day', () => {
    const weeks = calendarWeeks();
    expect(weeks).toHaveLength(3);
    expect(weeks[0][0]).toBe('2037-11-01');
    expect(weeks[2][6]).toBe('2037-11-21');
    expect(Object.keys(calendarDays).sort()).toEqual(tripDates);
    for (const day of Object.values(calendarDays))
      expect((day.extra ?? []).length).toBeLessThanOrEqual(2);
  });

  it('splits the trip into city stretches from the hotel stays, moving at midday', () => {
    expect(citySpans()).toEqual([
      { city: 'flight', start: 2, end: 3.5 },
      { city: 'tokyo', start: 3.5, end: 5.5 },
      { city: 'kobe', start: 5.5, end: 8.5 },
      { city: 'osaka', start: 8.5, end: 11.5 },
      { city: 'tokyo', start: 11.5, end: 15.5 },
      { city: 'disney', start: 15.5, end: 18.5 },
      { city: 'flight', start: 18.5, end: 19 },
    ]);
    expect(homeCity('2037-11-09')).toBe('osaka');
    expect(homeCity('2037-11-03')).toBe('flight');
  });

  it('rounds ribbons only at real ends and names only those a day or longer', () => {
    const first = weekRibbons('2037-11-01');
    expect(first.map((r) => [r.city, r.columnStart, r.columnEnd])).toEqual([
      ['flight', 3, 6],
      ['tokyo', 6, 10],
      ['kobe', 10, 15],
    ]);
    expect(first[2]).toMatchObject({ roundStart: true, roundEnd: false, labelled: true });
    const third = weekRibbons('2037-11-15');
    expect(third.at(-1)).toMatchObject({ city: 'flight', labelled: false, roundEnd: true });
  });

  it('stamps only tapped days before the trip, and past days on their own during it', () => {
    const before = new Date('2037-10-14T12:00:00+03:00');
    const during = new Date('2037-11-06T10:00:00+09:00');
    expect([...stampedDays(['2037-11-04', 'nope'], before)]).toEqual(['2037-11-04']);
    expect([...stampedDays([], during)].sort()).toEqual([
      '2037-11-02',
      '2037-11-03',
      '2037-11-04',
      '2037-11-05',
    ]);
  });

  it('renders the poster with flights, 17 tappable days and the five hotels', () => {
    const html = renderToStaticMarkup(React.createElement(SchedulePage, {}));
    expect(html.match(/class="calendar-cell[^"]*" style/g)).toHaveLength(17 + 4);
    expect(html.match(/aria-pressed=/g)).toHaveLength(17);
    expect(html).toContain('הלוך LY91');
    expect(html).toContain('חזור LY92');
    expect(html).toContain('איפה ישנים · 5 מלונות');
    expect(html).toContain('חוברת החותמות · 0/17');
    expect(html).toContain('בקיוטו');
  });
});
