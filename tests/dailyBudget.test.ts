import { describe, expect, it } from 'vitest';
import { dailyBudget, POCKET_YEN } from '../src/data/dailyBudget';
import { allEvents, tripDates } from '../src/data/trip';
import { dayTotals, rangeTotals, stopPrice, yenToShekels } from '../src/lib/dailyBudget';

const RATE = 0.0196;
const day = (date: string) => dailyBudget.find((d) => d.date === date)!;

describe('daily budget', () => {
  it('has one entry per day in Japan, in order', () => {
    expect(dailyBudget.map((d) => d.date)).toEqual(tripDates.slice(1));
  });

  it('links prices only to stops that exist in the plan', () => {
    const ids = new Set(allEvents.map((event) => event.id));
    const stops = dailyBudget.flatMap((d) =>
      [...d.food, ...d.extra, ...d.shop].flatMap((item) => (item.stop ? [item.stop] : [])),
    );
    expect(stops.filter((id) => !ids.has(id))).toEqual([]);
  });

  it('matches the daily budget page for 12.11 (food budget, spa, shared-out shopping)', () => {
    const totals = dayTotals(day('2037-11-12'), dailyBudget, RATE);
    expect(totals.food).toBe(8000);
    expect(totals.extra).toBe(19250);
    expect(totals.shop).toBe(23000);
    expect(totals.move).toBe(700);
    // Pocket money and the day's Suica rides; the spa is card only.
    expect(totals.cash).toBe(POCKET_YEN + 700);
    expect(totals.card).toBe(totals.total - totals.cash);
    expect(yenToShekels(totals.total, RATE)).toBe(999);
  });

  it('adds up a range in either order', () => {
    const range = rangeTotals('2037-11-12', '2037-11-08', dailyBudget, RATE);
    expect(range.days.map((d) => d.date)).toEqual([
      '2037-11-08',
      '2037-11-09',
      '2037-11-10',
      '2037-11-11',
      '2037-11-12',
    ]);
    const days = range.days.map((d) => dayTotals(d, dailyBudget, RATE).total);
    expect(range.total).toBe(days.reduce((a, b) => a + b, 0));
    expect(yenToShekels(range.total, RATE)).toBe(3151);
  });

  it('counts luggage sent from a hotel desk as cash, but not the N’EX on Suica', () => {
    const fourth = dayTotals(day('2037-11-04'), dailyBudget, RATE);
    expect(fourth.cash).toBe(POCKET_YEN + 3160 + 1000);
    const third = dayTotals(day('2037-11-03'), dailyBudget, RATE);
    expect(third.cash).toBe(POCKET_YEN + (3750 - 3140));
  });

  it('prices a stop from its items and marks cash', () => {
    expect(stopPrice('d12-04')).toEqual({ yen: 19250, cash: false });
    expect(stopPrice('d6-02')).toEqual({ yen: 1800, cash: true });
    expect(stopPrice('d5-02')?.yen).toBe(6000);
    expect(stopPrice('gion-walk')).toEqual({ yen: 3800, cash: true });
    expect(stopPrice('d12-01')).toBeNull();
  });
});
