import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { expenses, plannedExpenses } from '../src/data/budget';
import { restaurants, restaurantForEvent } from '../src/data/dining';
import { gyms } from '../src/data/gyms';
import { shoppingDays } from '../src/data/shopping';
import { tickets } from '../src/data/tickets';
import { allEvents } from '../src/data/trip';
import { BudgetPage } from '../src/features/budget/BudgetPage';
import { rankRestaurants } from '../src/features/explore/ranking';
import { DiscoverPage } from '../src/features/explore/DiscoverPage';
import { forecastWindow, parseForecast } from '../src/features/weather/forecast';
import {
  buildIcs,
  calendarEvents,
  calendarSpan,
  eventEnd,
  googleCalendarUrl,
} from '../src/lib/calendar';
import { settlement, sharesOf, split, summarize, toAgorot, yenToAgorot } from '../src/lib/money';
import '../src/i18n';

const render = (component: React.FC<never>, props = {}) =>
  renderToStaticMarkup(React.createElement(component as React.FC, props));

describe('budget', () => {
  it('converts yen with the dated reference rate and keeps unknown amounts out of totals', () => {
    expect(toAgorot({ amount: 17600, currency: 'JPY' })).toBe(34077); // ₪340.77, as in the original plan
    expect(toAgorot({ amount: 29040, currency: 'JPY' })).toBe(56228); // ₪562.28, as in the original plan
    expect(toAgorot({ amount: 2347.57, currency: 'USD' })).toBeNull();
    expect(yenToAgorot(17600)).toBe(toAgorot({ amount: 17600, currency: 'JPY' }));
    const summary = summarize(expenses);
    expect(summary.unknown).toEqual([]);
    expect(summary.shares.dana + summary.shares.noa + summary.shares.unassigned).toBe(
      summary.total,
    );
    const { paid, reserved, onSite } = summary.byState;
    expect(paid + reserved + onSite).toBe(summary.total);
  });

  it('uses the Drive sheet’s real shekel charges where it has them', () => {
    const at = (id: string) => toAgorot(expenses.find((e) => e.id === id)!);
    expect(at('flight')).toBe(1200000); // both tickets, not one in dollars
    expect(at('tokyo_chabad')).toBe(52341);
    expect(at('kobe_chabad')).toBe(52972);
    expect(at('usj')).toBe(156398);
  });

  it('works out who still owes whom from unsettled costs one of them paid', () => {
    // Noa owes half of teamLab (₪215.34), USJ (₪1,563.98) and UZU (¥17,600 → ₪340.77).
    expect(settlement(plannedExpenses)).toMatchObject({
      from: 'noa',
      to: 'dana',
      amount: 106004,
    });
    const base = {
      dateLabel: '',
      title: '',
      category: 'food',
      currency: 'ILS',
      state: 'paid',
    } as const;
    expect(
      settlement([
        { ...base, id: 'a', amount: 100, owner: 'both', paidBy: 'dana', settled: false },
        { ...base, id: 'b', amount: 300, owner: 'both', paidBy: 'noa', settled: false },
        { ...base, id: 'c', amount: 999, owner: 'both', paidBy: 'noa', settled: true },
      ]),
    ).toMatchObject({ from: 'dana', to: 'noa', amount: 10000 });
  });

  it('counts a cost outside the trip in who owes whom, but not in the trip totals', () => {
    const base = {
      title: '',
      category: 'other',
      currency: 'ILS',
      state: 'paid',
      owner: 'both',
    } as const;
    const costs = [
      { ...base, id: 'trip', amount: 1000, paidBy: 'dana' as const },
      { ...base, id: 'home', amount: 400, paidBy: 'noa' as const, outsideTrip: true },
    ];
    expect(summarize(costs).total).toBe(100000);
    expect(settlement(costs)).toMatchObject({ from: 'noa', to: 'dana', amount: 30000 });
  });

  it('takes settle-ups off the balance, and can flip who owes whom', () => {
    const base = {
      title: '',
      category: 'food',
      currency: 'ILS',
      state: 'paid',
      owner: 'both',
    } as const;
    const costs = [{ ...base, id: 'a', amount: 1000, paidBy: 'dana' as const }];
    const pay = (amount: number, currency: 'ILS' | 'JPY' = 'ILS', shekels?: number) => ({
      id: `p${amount}`,
      from: 'noa' as const,
      to: 'dana' as const,
      currency,
      amount,
      shekels,
      date: '2037-11-04',
      at: 1,
    });
    // A cost added in the app has no `settled`: it counts until settled up.
    expect(settlement(costs)).toMatchObject({ from: 'noa', amount: 50000, paidBack: 0 });
    expect(settlement(costs, [pay(200)])).toMatchObject({ from: 'noa', amount: 30000 });
    expect(settlement(costs, [pay(500)])).toBeNull();
    expect(settlement(costs, [pay(600)])).toMatchObject({
      from: 'dana',
      to: 'noa',
      amount: 10000,
    });
    // Yen handed over count at the shekel value fixed that day.
    expect(settlement(costs, [pay(5000, 'JPY', 100)])).toMatchObject({ amount: 40000 });
  });

  it('splits by exact parts and keeps the shekel value fixed when it was entered', () => {
    expect(sharesOf({ owner: 'both', parts: { dana: 3000, noa: 1000 } }, 10001)).toEqual({
      dana: 7501,
      noa: 2500,
      unassigned: 0,
    });
    expect(sharesOf({ owner: 'noa', parts: null }, 500).noa).toBe(500);
    expect(toAgorot({ amount: 4000, currency: 'JPY', shekels: 97.5 })).toBe(9750);
    expect(toAgorot({ amount: 100, currency: 'USD', shekels: 371 })).toBe(37100);
    expect(toAgorot({ amount: 100, currency: 'ILS', shekels: 5 })).toBe(10000);
  });

  it('splits shared costs to the agora and charges the spa to Dana only', () => {
    expect(split(101, 'both')).toEqual({ dana: 51, noa: 50, unassigned: 0 });
    expect(split(500, 'dana')).toEqual({ dana: 500, noa: 0, unassigned: 0 });
    expect(expenses.find((e) => e.id === 'headspa')!.owner).toBe('dana');
  });

  it('counts a booking once even if it is listed twice', () => {
    const once = summarize([expenses[0]]).total;
    expect(summarize([expenses[0], expenses[0]]).total).toBe(once);
  });

  it('shows shekels on the main screen', () => {
    const html = render(BudgetPage);
    expect(html).toContain('₪');
    expect(html).toContain('דנה');
    expect(html).toContain('נועה');
  });
});

describe('calendar export', () => {
  const at = (id: string) => allEvents.find((e) => e.id === id)!;

  it('uses the right zones: Israel for LY91 departure, Japan for everything else', () => {
    expect(calendarSpan(at('d2-01'))).toEqual({
      start: '20371102T170000Z',
      end: '20371103T042500Z',
      allDay: false,
    });
    expect(calendarSpan(at('d18-03')).end).toBe('20371118T200500Z');
    expect(calendarSpan(at('d4-01'))).toEqual({
      start: '20371104T010000Z',
      end: '20371104T013000Z',
      allDay: false,
    });
    expect(calendarSpan(at('d16-01')).allDay).toBe(true);
  });

  it('ends a late event on the next date when its hour runs past midnight', () => {
    expect(eventEnd({ date: '2037-11-04', time: '20:00', end: null })).toEqual({
      date: '2037-11-04',
      clock: '21:00',
    });
    expect(eventEnd({ date: '2037-11-04', time: '23:30', end: null })).toEqual({
      date: '2037-11-05',
      clock: '00:30',
    });
    expect(eventEnd({ date: '2037-11-04', time: '22:00', end: '01:00' }).date).toBe('2037-11-05');
    const late = { ...at('d4-01'), time: '23:30', end: null };
    expect(calendarSpan(late)).toMatchObject({
      start: '20371104T143000Z',
      end: '20371104T153000Z',
    });
  });

  it('builds links and an ICS with stable IDs and no duplicates', () => {
    const url = new URL(googleCalendarUrl(at('d9-05')));
    expect(url.searchParams.get('dates')).toBe('20371109T090000Z/20371109T101500Z');
    expect(url.searchParams.get('ctz')).toBe('Asia/Tokyo');
    const events = calendarEvents(allEvents);
    expect(events.some((e) => e.id === 'd3-01')).toBe(false); // original plan: calendarDisabled
    expect(events.every((e) => e.status === 'confirmed')).toBe(true);
    const ics = buildIcs(events, new Date('2037-10-13T00:00:00Z'));
    const uids = [...ics.matchAll(/UID:(.+)\r\n/g)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(events.length);
  });
});

describe('restaurants', () => {
  it('lists all 32 fully vegan places and links every planned meal to one', () => {
    expect(restaurants).toHaveLength(32);
    for (const r of restaurants.filter((x) => x.check))
      expect(r.check!.link).toMatch(/^https:\/\//);
    for (const r of restaurants) expect(r.sources.length, r.id).toBeGreaterThan(0);
    // We don't like curry or Indian food.
    for (const r of restaurants) expect(r.food, r.id).not.toMatch(/קארי|הודי/);
    const meals = allEvents.filter(
      (e) => e.kind === 'food' && !['d16-02', 'd17-02'].includes(e.id),
    );
    for (const meal of meals) expect(restaurantForEvent(meal.id), meal.id).toBeDefined();
  });

  it('suggests nearby alternatives first and keeps the UZU Kyoto booking fixed', () => {
    const ranked = rankRestaurants(restaurants, 'gion', 'nearby', 'zirael');
    expect(ranked[0].id).toBe('zirael');
    expect(ranked.slice(0, 3).every((r) => r.city === 'kyoto')).toBe(true);
    expect(restaurants.find((r) => r.id === 'uzu-kyoto')!.booked).toBeTruthy();
    const html = render(DiscoverPage, { tab: 'food', date: '2037-11-09', eventId: 'd9-04' });
    expect(html).toContain('לפי התכנון המקורי · מקור ותאריך לא תועדו');
    expect(html).not.toMatch(/₪\d/); // no invented restaurant prices
  });
});

describe('shopping and gyms', () => {
  it('keeps every shopping area and day from the original plan', () => {
    expect(shoppingDays.map((d) => d.date)).toEqual([
      '2037-11-04',
      '2037-11-05',
      '2037-11-08',
      '2037-11-11',
      '2037-11-12',
      '2037-11-13',
      '2037-11-15',
    ]);
    const names = shoppingDays.flatMap((d) => d.picks.map((p) => p.name)).join(' ');
    for (const shop of ['Itoya', 'Sekaido', 'Tools Osaka', 'UNIQLO', 'GU', 'SHIBUYA109', 'PARCO'])
      expect(names).toContain(shop);
    for (const shop of ['@cosme TOKYO', '@cosme OSAKA', 'Pokémon Center', 'Card Labo'])
      expect(names).toContain(shop);
    for (const day of shoppingDays) expect(day.picks[0].check).toBeUndefined(); // the original pick stays first
  });

  it('prefers Saturday nights and never marks the Kobe gym as verified', () => {
    expect(gyms.filter((g) => g.saturdayNight).map((g) => g.date)).toEqual([
      '2037-11-07',
      '2037-11-14',
    ]);
    expect(gyms.find((g) => g.id === 'golds-kobe')!.access).toBe('unverified');
    const html = render(DiscoverPage, { tab: 'gyms' });
    expect(html).toContain('צריך לאמת כניסה חד־פעמית');
  });
});

describe('tickets', () => {
  it('covers every confirmed booking', () => {
    const covered = new Set(tickets.flatMap((t) => t.eventIds));
    for (const event of allEvents.filter((e) => e.status === 'confirmed' && e.kind !== 'hotel'))
      expect(covered.has(event.id), event.id).toBe(true);
  });
});

describe('weather', () => {
  it('never shows a forecast outside the 16-day window', () => {
    expect(forecastWindow('2037-11-04', '2037-10-13')).toEqual({
      status: 'too-early',
      daysUntilWindow: 7,
    });
    expect(forecastWindow('2037-11-04', '2037-11-01').status).toBe('open');
    expect(forecastWindow('2037-11-04', '2037-11-05').status).toBe('past');
    expect(parseForecast({}, 'x')).toBeNull();
    expect(
      parseForecast(
        {
          daily: {
            time: ['2037-11-04'],
            weather_code: [61],
            temperature_2m_max: [17.6],
            temperature_2m_min: [10.2],
            precipitation_probability_max: [60],
          },
        },
        '2037-11-01T00:00:00Z',
      ),
    ).toMatchObject({ max: 18, min: 10, rainChance: 60 });
  });
});
