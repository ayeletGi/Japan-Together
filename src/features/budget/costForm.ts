import type { CostCategory, Currency, Expense, Payment, Traveller, Who } from '../../data/budget';
import type { ExpenseChange, PaymentChange } from '../../data/live';
import { formatDayDot } from '../../lib/dates';
import { parseAmount } from '../yen/rate';

/**
 * The "+ cost" and "settle up" forms, Splitwise style: what the sheet shows, and the entry it
 * saves for both of us. Only the fields that changed are saved when editing.
 */

export type ForWhom = 'both' | Traveller | 'parts';
export type CostProblem = 'title' | 'amount' | 'shekels' | 'parts' | 'date';

export interface CostForm {
  title: string;
  amount: string;
  currency: Currency;
  /** The shekel value, for yen or dollars; empty means "at today's rate" for yen. */
  shekels: string;
  paidBy: Traveller;
  forWhom: ForWhom;
  danaPart: string;
  noaPart: string;
  category: CostCategory;
  date: string;
  note: string;
}

export interface PaymentForm {
  from: Traveller;
  amount: string;
  currency: 'ILS' | 'JPY';
  shekels: string;
  date: string;
  note: string;
}

export const otherOne = (who: Traveller): Traveller => (who === 'dana' ? 'noa' : 'dana');
export const asTraveller = (who: string | undefined): Traveller => (who === 'noa' ? 'noa' : 'dana');

/** Today on this phone, YYYY-MM-DD (in Japan, Japan's date). */
export function today(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const round2 = (value: number) => Math.round(value * 100) / 100;
const text = (value: number | null | undefined) => (value == null ? '' : String(value));

export function emptyCostForm(me: Traveller, date = today()): CostForm {
  return {
    title: '',
    amount: '',
    currency: 'JPY',
    shekels: '',
    paidBy: me,
    forWhom: 'both',
    danaPart: '',
    noaPart: '',
    category: 'food',
    date,
    note: '',
  };
}

export function costFormFrom(expense: Expense, me: Traveller): CostForm {
  const forWhom: ForWhom = expense.parts
    ? 'parts'
    : expense.owner === 'unassigned'
      ? 'both'
      : expense.owner;
  return {
    title: expense.title,
    amount: text(expense.amount),
    currency: expense.currency,
    shekels: expense.currency === 'ILS' ? '' : text(expense.shekels),
    paidBy: expense.paidBy ?? me,
    forWhom,
    danaPart: text(expense.parts?.dana),
    noaPart: text(expense.parts?.noa),
    category: expense.category,
    date: expense.date ?? '',
    note: expense.note ?? '',
  };
}

/** The other part when one is typed, so the two always add up to the amount. */
export function restOf(amount: string, part: string): string {
  const total = parseAmount(amount);
  const given = parseAmount(part);
  if (total === null || given === null || given > total) return '';
  return String(round2(total - given));
}

/**
 * The cost to save, or what is missing. With `before` (an edit), only the fields that differ; a
 * cost from the sheet keeps its state, date label and rate unless the amount changed.
 */
export function buildCost(
  form: CostForm,
  ilsPerJpy: number,
  before?: Expense,
): { change: ExpenseChange } | { problem: CostProblem } {
  const title = form.title.trim();
  if (!title) return { problem: 'title' };
  const amount = parseAmount(form.amount);
  if (!amount) return { problem: 'amount' };
  if (!before && !form.date) return { problem: 'date' };

  const full: ExpenseChange = {
    title,
    category: form.category,
    currency: form.currency,
    amount,
    paidBy: form.paidBy,
    note: form.note.trim(),
  };

  if (form.currency === 'ILS') full.shekels = null;
  else if (form.shekels.trim()) {
    const shekels = parseAmount(form.shekels);
    if (shekels === null) return { problem: 'shekels' };
    full.shekels = shekels;
  } else if (form.currency === 'USD') return { problem: 'shekels' };
  else if (!before || before.amount !== amount || before.currency !== form.currency) {
    full.shekels = round2(amount * ilsPerJpy);
  }

  if (form.forWhom === 'parts') {
    const dana = parseAmount(form.danaPart);
    const noa = parseAmount(form.noaPart);
    if (dana === null || noa === null || Math.abs(dana + noa - amount) > 0.005) {
      return { problem: 'parts' };
    }
    full.owner = 'both';
    full.parts = { dana, noa };
  } else {
    full.owner = form.forWhom;
    full.parts = null;
  }

  if (form.date) {
    full.date = form.date;
    full.dateLabel = formatDayDot(form.date);
  }

  if (!before) return { change: { ...full, state: 'paid' } };
  const change: ExpenseChange = {};
  for (const [field, value] of Object.entries(full) as [keyof ExpenseChange, unknown][]) {
    const old = (before as unknown as Record<string, unknown>)[field];
    const same =
      field === 'note'
        ? (old ?? '') === value
        : JSON.stringify(old ?? null) === JSON.stringify(value);
    if (!same) (change as Record<string, unknown>)[field] = value;
  }
  return { change };
}

/** A new cost's id and its entry, with who added it and when. */
export function newCost(change: ExpenseChange, who: string | undefined): [string, ExpenseChange] {
  return [newId('c'), { ...change, at: Date.now(), ...(isWho(who) ? { addedBy: who } : {}) }];
}

const isWho = (who: string | undefined): who is Who =>
  who === 'dana' || who === 'noa' || who === 'claude';

export function emptyPaymentForm(
  owed: { from: Traveller; amount: number } | null,
  me: Traveller,
  date = today(),
): PaymentForm {
  return {
    from: owed?.from ?? me,
    amount: owed ? String(owed.amount / 100) : '',
    currency: 'ILS',
    shekels: '',
    date,
    note: '',
  };
}

export function paymentFormFrom(payment: Payment): PaymentForm {
  return {
    from: payment.from,
    amount: text(payment.amount),
    currency: payment.currency,
    shekels: payment.currency === 'ILS' ? '' : text(payment.shekels),
    date: payment.date,
    note: payment.note ?? '',
  };
}

export function buildPayment(
  form: PaymentForm,
  ilsPerJpy: number,
  before?: Payment,
): { change: PaymentChange } | { problem: CostProblem } {
  const amount = parseAmount(form.amount);
  if (!amount) return { problem: 'amount' };
  if (!form.date) return { problem: 'date' };
  let shekels: number | null = null;
  if (form.currency === 'JPY') {
    if (form.shekels.trim()) {
      shekels = parseAmount(form.shekels);
      if (shekels === null) return { problem: 'shekels' };
    } else shekels = round2(amount * ilsPerJpy);
  }
  const full: PaymentChange = {
    from: form.from,
    to: otherOne(form.from),
    currency: form.currency,
    amount,
    shekels,
    date: form.date,
    note: form.note.trim(),
  };
  if (!before) return { change: full };
  const change: PaymentChange = {};
  for (const [field, value] of Object.entries(full) as [keyof PaymentChange, unknown][]) {
    const old = (before as unknown as Record<string, unknown>)[field];
    if (JSON.stringify(old ?? (field === 'note' ? '' : null)) !== JSON.stringify(value)) {
      (change as Record<string, unknown>)[field] = value;
    }
  }
  return { change };
}

export function newPayment(
  change: PaymentChange,
  who: string | undefined,
): [string, PaymentChange] {
  return [newId('p'), { ...change, at: Date.now(), ...(isWho(who) ? { addedBy: who } : {}) }];
}
