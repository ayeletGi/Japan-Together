import {
  dailyBudget,
  POCKET_YEN,
  SHOP_BUDGET_YEN,
  type DailyDay,
  type DailyItem,
} from '../data/dailyBudget';
import { JPY_RATE } from '../data/budget';

/** Yen per person of one item; a shekel price goes back to yen by the reference rate. */
export function itemYen(item: DailyItem, ilsPerJpy: number = JPY_RATE.ilsPerJpy): number {
  if (item.yen !== undefined) return item.yen;
  return item.ils !== undefined ? item.ils / ilsPerJpy : 0;
}

const sum = (items: DailyItem[], rate: number) =>
  items.reduce((total, item) => total + itemYen(item, rate), 0);

/** All the trip's shopping estimates, which `SHOP_BUDGET_YEN` is spread over. */
const shopEstimate = (days: DailyDay[], rate: number) =>
  days.reduce((total, day) => total + sum(day.shop, rate), 0);

/** One day's (or a range's) budget per person, in yen. */
export interface DayTotals {
  food: number;
  extra: number;
  shop: number;
  /** Local rides + luggage forwarding. */
  move: number;
  total: number;
  cash: number;
  card: number;
}

/** What needs cash on a day: items marked cash, pocket money, hotel-desk luggage, Suica top-up. */
export function cashYen(day: DailyDay, rate: number = JPY_RATE.ilsPerJpy): number {
  const items = [...day.food, ...day.extra, ...day.shop].filter((item) => item.cash);
  const suica = day.rides - (day.notSuica ?? 0);
  return (
    sum(items, rate) +
    POCKET_YEN +
    (day.luggage?.hotelDesk ? day.luggage.yen : 0) +
    // A physical Suica card is topped up at station machines, in cash only.
    Math.max(0, suica)
  );
}

/**
 * A day's budget: food is the budget we chose or the estimate if higher, shopping is the trip's
 * shopping budget shared out by the day's list (rounded to ¥500), the rest as listed.
 */
export function dayTotals(
  day: DailyDay,
  days: DailyDay[] = dailyBudget,
  rate: number = JPY_RATE.ilsPerJpy,
): DayTotals {
  const food = Math.max(sum(day.food, rate), day.foodBudget);
  const extra = sum(day.extra, rate);
  const estimate = shopEstimate(days, rate);
  const shop = estimate
    ? Math.round((sum(day.shop, rate) * SHOP_BUDGET_YEN) / estimate / 500) * 500
    : 0;
  const move = day.rides + (day.luggage?.yen ?? 0);
  const total = food + extra + shop + move;
  const cash = cashYen(day, rate);
  return { food, extra, shop, move, total, cash, card: total - cash };
}

/** The budget of the days from `from` to `to` (inclusive, either order). */
export function rangeTotals(
  from: string,
  to: string,
  days: DailyDay[] = dailyBudget,
  rate: number = JPY_RATE.ilsPerJpy,
): DayTotals & { days: DailyDay[] } {
  const [start, end] = from <= to ? [from, to] : [to, from];
  const picked = days.filter((day) => day.date >= start && day.date <= end);
  const totals: DayTotals = { food: 0, extra: 0, shop: 0, move: 0, total: 0, cash: 0, card: 0 };
  for (const day of picked) {
    const one = dayTotals(day, days, rate);
    for (const key of Object.keys(totals) as (keyof DayTotals)[]) totals[key] += one[key];
  }
  return { ...totals, days: picked };
}

/** The price of one stop on the day's plan: its items together, and whether any needs cash. */
export interface StopPrice {
  yen: number;
  cash: boolean;
}

export function stopPrice(
  stopId: string,
  days: DailyDay[] = dailyBudget,
  rate: number = JPY_RATE.ilsPerJpy,
): StopPrice | null {
  let yen = 0;
  let cash = false;
  let found = false;
  for (const day of days) {
    for (const item of [...day.food, ...day.extra, ...day.shop]) {
      if (item.stop !== stopId) continue;
      found = true;
      yen += itemYen(item, rate);
      cash ||= Boolean(item.cash);
    }
  }
  return found ? { yen, cash } : null;
}

/** Yen → rounded whole shekels, for the budget's estimates. */
export const yenToShekels = (yen: number, rate: number = JPY_RATE.ilsPerJpy) =>
  Math.round(yen * rate);
