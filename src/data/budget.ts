/**
 * Trip costs, one entry per booking so a receipt and a confirmation are never counted twice.
 * Shekel amounts, discounts, who paid and what was settled come from the shared Drive sheet
 * (תקציב.xlsx, 13.10.2026). Rows the sheet still had as estimates or "not booked yet" were taken
 * from the booking receipts instead. Receipts and booking references stay private.
 */

import { COST_CATEGORIES, NEW_EXPENSE_FIELDS } from '../../shared/liveSchema';
import { liveChanges, onLiveChange, type ExpenseChange } from './live';

export type Currency = 'ILS' | 'JPY' | 'USD';
/** Who the cost is for: shared half-half, one traveller, or not yet decided. */
export type Owner = 'both' | 'dana' | 'noa' | 'unassigned';
export type Traveller = 'dana' | 'noa';
/** `onSite`: booked, paid on the day in Japan. */
export type PaidState = 'paid' | 'reserved' | 'onSite';
export type CostCategory = (typeof COST_CATEGORIES)[number];
/** Whose code saved it. */
export type Who = Traveller | 'claude';

export interface Expense {
  id: string;
  /** Left out for costs paid before the trip. */
  dateLabel?: string;
  title: string;
  category: CostCategory;
  /** What was (or will be) charged. ILS when the sheet has the real card charge. */
  currency: Currency;
  amount: number;
  /** The booking's own price when the charge was in another currency. */
  original?: { amount: number; currency: Currency };
  /** Shekel discount already taken off `amount`. */
  discount?: number;
  owner: Owner;
  state: PaidState;
  /** Who paid up front, when known. */
  paidBy?: Traveller;
  /** Whether the other traveller already transferred her half. Only meaningful with `paidBy`. */
  settled?: boolean;
  /** Not a receipt amount; the sheet's own estimate. */
  estimate?: boolean;
  /** Shared between us but not part of the trip: counts in who owes whom, not in the trip totals. */
  outsideTrip?: boolean;
  note?: string;
  /** The day it was paid (YYYY-MM-DD), for costs added in the app. */
  date?: string | null;
  /**
   * The shekel value fixed when it was entered (for yen or dollars), so the balance doesn't move
   * with the rate. Without it yen go by `JPY_RATE`.
   */
  shekels?: number | null;
  /** Exact parts, in the cost's own currency, instead of half-half. */
  parts?: { dana: number; noa: number } | null;
  /** When it was added in the app (ms), and with whose code. */
  at?: number;
  addedBy?: Who;
}

/** Money one of us gave the other to settle up (Bit, cash…). */
export interface Payment {
  id: string;
  from: Traveller;
  to: Traveller;
  currency: 'ILS' | 'JPY';
  amount: number;
  /** For yen: the shekel value on the day. */
  shekels?: number | null;
  date: string;
  note?: string;
  at: number;
  addedBy?: Who;
}

/**
 * Reference yen → shekel rate checked on 12.10.2026 (original plan), used only for rows paid in yen. Real card
 * charges can differ because of the charge date and fees.
 */
export const JPY_RATE = { ilsPerJpy: 0.0193621, checkedOn: '2037-10-12' } as const;

/** The costs from the Drive sheet and the receipts, before any change made in the app. */
export const plannedExpenses: Expense[] = [
  {
    id: 'flight',
    dateLabel: '2 + 18.11',
    title: 'EL AL LY91 / LY92 · שני כרטיסים',
    category: 'flight',
    currency: 'ILS',
    amount: 12000,
    discount: 115,
    owner: 'both',
    state: 'paid',
    paidBy: 'noa',
    settled: true,
    note: 'סכום לדוגמה.',
  },
  {
    id: 'shinagawa',
    dateLabel: '3–5.11',
    title: 'Shinagawa Prince Hotel · שני לילות',
    category: 'hotel',
    currency: 'ILS',
    amount: 1200,
    discount: 54.06,
    owner: 'both',
    state: 'paid',
    paidBy: 'noa',
    settled: true,
  },
  {
    id: 'kobe_hotel',
    dateLabel: '5–8.11',
    title: 'CANDEO Kobe Tor Road · שלושה לילות',
    category: 'hotel',
    currency: 'ILS',
    amount: 1700,
    discount: 54.07,
    owner: 'both',
    state: 'paid',
    paidBy: 'noa',
    settled: true,
  },
  {
    id: 'osaka_hotel',
    dateLabel: '8–11.11',
    title: 'CANDEO Osaka Namba · שלושה לילות',
    category: 'hotel',
    currency: 'ILS',
    amount: 1800,
    discount: 54.06,
    owner: 'both',
    state: 'paid',
    paidBy: 'noa',
    settled: true,
  },
  {
    id: 'omori_hotel',
    dateLabel: '11–15.11',
    title: 'MYSTAYS PREMIER Omori · ארבעה לילות',
    category: 'hotel',
    currency: 'ILS',
    amount: 2600,
    discount: 53.29,
    owner: 'both',
    state: 'paid',
    paidBy: 'noa',
    settled: true,
  },
  {
    id: 'oriental_hotel',
    dateLabel: '15–18.11',
    title: 'Oriental Hotel Tokyo Bay · שלושה לילות',
    category: 'hotel',
    currency: 'ILS',
    amount: 2100,
    discount: 53.27,
    owner: 'both',
    state: 'paid',
    paidBy: 'noa',
    settled: true,
  },
  {
    id: 'vegan_map',
    title: 'מפת המלצות אוכל צמחוני / טבעוני',
    category: 'guide',
    currency: 'ILS',
    amount: 98,
    discount: 42,
    owner: 'both',
    state: 'paid',
    paidBy: 'dana',
    settled: true,
  },
  {
    id: 'teamlab',
    dateLabel: '4.11',
    title: 'teamLab Planets · שני כרטיסים',
    category: 'attraction',
    currency: 'ILS',
    amount: 215.34,
    original: { amount: 11200, currency: 'JPY' },
    discount: 6.24,
    owner: 'both',
    state: 'paid',
    paidBy: 'dana',
    settled: false,
  },
  {
    id: 'shinkansen_out',
    dateLabel: '5.11',
    title: 'Shinkansen לקובה · NOZOMI 53 לשתיכן',
    category: 'train',
    currency: 'JPY',
    amount: 30580,
    owner: 'both',
    state: 'reserved',
  },
  {
    id: 'kobe_chabad',
    dateLabel: '7.11',
    title: 'שבת בבית חב״ד קובה · שתי מבוגרות',
    category: 'food',
    currency: 'ILS',
    amount: 529.72,
    owner: 'both',
    state: 'paid',
    paidBy: 'noa',
    settled: true,
  },
  {
    id: 'uzukyoto',
    dateLabel: '9.11',
    title: 'UZU Kyoto · שתי ארוחות',
    category: 'food',
    currency: 'JPY',
    amount: 17600,
    owner: 'both',
    state: 'paid',
    paidBy: 'dana',
    settled: false,
    note: 'שולם מראש ב־TableCheck. לא מופיע בגיליון ב־Drive.',
  },
  {
    id: 'kimono',
    dateLabel: '9.11',
    title: 'KIMONO RENTAL MOMO · גיון, לשתיכן',
    category: 'attraction',
    currency: 'ILS',
    amount: 870,
    owner: 'both',
    state: 'onSite',
    estimate: true,
    note: 'הערכה מהגיליון; ההזמנה באינסטגרם בלי מחיר. משלמות בחנות.',
  },
  {
    id: 'usj',
    dateLabel: '10.11',
    title: 'USJ · Studio Pass + Express Pass לשתיכן',
    category: 'attraction',
    currency: 'ILS',
    amount: 1563.98,
    original: { amount: 60600, currency: 'JPY' },
    discount: 45.36,
    owner: 'both',
    state: 'paid',
    paidBy: 'dana',
    settled: false,
    note: '2 × ¥9,400 כניסה + 2 × ¥20,900 Express 5.',
  },
  {
    id: 'shinkansen_back',
    dateLabel: '11.11',
    title: 'Shinkansen חזור · NOZOMI 46 לשתיכן',
    category: 'train',
    currency: 'JPY',
    amount: 29040,
    owner: 'both',
    state: 'reserved',
  },
  {
    id: 'headspa',
    dateLabel: '12.11',
    title: 'Shibuya ANNEX Head Spa · לדנה בלבד',
    category: 'treatment',
    currency: 'JPY',
    amount: 19250,
    owner: 'dana',
    state: 'onSite',
    note: 'תשלום בכרטיס בלבד, במקום.',
  },
  {
    id: 'tokyo_chabad',
    dateLabel: '13–14.11',
    title: 'סעודות שבת בחב״ד טוקיו · שתיכן',
    category: 'food',
    currency: 'ILS',
    amount: 523.41,
    original: { amount: 170.5, currency: 'USD' },
    owner: 'both',
    state: 'paid',
    paidBy: 'noa',
    settled: true,
  },
  {
    id: 'disneyland',
    dateLabel: '16.11',
    title: 'Tokyo Disneyland · שני כרטיסים',
    category: 'attraction',
    currency: 'JPY',
    amount: 21800,
    owner: 'both',
    state: 'paid',
  },
  {
    id: 'disneysea',
    dateLabel: '17.11',
    title: 'Tokyo DisneySea · שני כרטיסים',
    category: 'attraction',
    currency: 'JPY',
    amount: 21800,
    owner: 'both',
    state: 'paid',
  },
];

/** The planned costs with the changes from the live database: new costs from the trip, and edits. */
export const expenses: Expense[] = [];
/** Settle-ups between us, newest first. */
export const payments: Payment[] = [];

function rebuild() {
  const changes = liveChanges().expenses;
  const merged = plannedExpenses.map((expense) => ({ ...expense, ...changes[expense.id] }));
  for (const [id, change] of Object.entries(changes)) {
    if (plannedExpenses.some((expense) => expense.id === id)) continue;
    // A new cost needs every field the totals use; an incomplete one is left out, not counted as 0.
    if (NEW_EXPENSE_FIELDS.every((field) => field in change))
      merged.push({ ...change, id } as Expense);
  }
  const kept = merged.filter((expense) => !(expense as ExpenseChange).removed);
  expenses.splice(0, expenses.length, ...kept);
  const paid = Object.entries(liveChanges().payments)
    .map(([id, change]) => ({ ...change, id }) as Payment)
    .sort((a, b) => b.at - a.at);
  payments.splice(0, payments.length, ...paid);
}
rebuild();
onLiveChange(rebuild);
