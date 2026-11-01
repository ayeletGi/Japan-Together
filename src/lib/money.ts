import {
  JPY_RATE,
  type Expense,
  type Owner,
  type PaidState,
  type Payment,
  type Traveller,
} from '../data/budget';

/** Amounts are handled in agorot (integers) so splits and totals never drift. */
export type Agorot = number;

/**
 * Shekel value of an expense or payment, or `null` when no rate or shekel charge is known (never
 * 0). A shekel value fixed when it was entered wins over the reference rate.
 */
export function toAgorot(expense: Pick<Expense, 'amount' | 'currency' | 'shekels'>): Agorot | null {
  if (expense.currency !== 'ILS' && typeof expense.shekels === 'number') {
    return Math.round(expense.shekels * 100);
  }
  switch (expense.currency) {
    case 'ILS':
      return Math.round(expense.amount * 100);
    case 'JPY':
      return yenToAgorot(expense.amount);
    case 'USD':
      return null;
  }
}

export function yenToAgorot(yen: number): Agorot {
  return Math.round(yen * JPY_RATE.ilsPerJpy * 100);
}

export interface Shares {
  dana: Agorot;
  noa: Agorot;
  /** Not yet assigned in the source; kept apart instead of being split by guess. */
  unassigned: Agorot;
}

/** Shared costs split half-half; an odd agora goes to Dana so the parts always add up. */
export function split(total: Agorot, owner: Owner): Shares {
  switch (owner) {
    case 'both': {
      const noa = Math.floor(total / 2);
      return { dana: total - noa, noa, unassigned: 0 };
    }
    case 'dana':
      return { dana: total, noa: 0, unassigned: 0 };
    case 'noa':
      return { dana: 0, noa: total, unassigned: 0 };
    case 'unassigned':
      return { dana: 0, noa: 0, unassigned: total };
  }
}

/**
 * Who each cost is for, in agorot: its exact parts when it has them (scaled to the shekel value,
 * the rest of an agora to Dana), otherwise by `owner`.
 */
export function sharesOf(item: Pick<Expense, 'owner' | 'parts'>, total: Agorot): Shares {
  const parts = item.parts;
  const sum = parts ? parts.dana + parts.noa : 0;
  if (!parts || sum <= 0) return split(total, item.owner);
  const noa = Math.round((total * parts.noa) / sum);
  return { dana: total - noa, noa, unassigned: 0 };
}

export interface BudgetSummary {
  total: Agorot;
  shares: Shares;
  byState: Record<PaidState, Agorot>;
  byCategory: Record<string, Agorot>;
  /** Expenses with no shekel amount; listed separately and excluded from totals. */
  unknown: Expense[];
}

export function summarize(items: Expense[]): BudgetSummary {
  const summary: BudgetSummary = {
    total: 0,
    shares: { dana: 0, noa: 0, unassigned: 0 },
    byState: { paid: 0, reserved: 0, onSite: 0 },
    byCategory: {},
    unknown: [],
  };
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) continue; // One booking, one transaction.
    if (item.outsideTrip) continue; // Settled between us, but not a trip cost.
    seen.add(item.id);
    const value = toAgorot(item);
    if (value === null) {
      summary.unknown.push(item);
      continue;
    }
    const shares = sharesOf(item, value);
    summary.total += value;
    summary.shares.dana += shares.dana;
    summary.shares.noa += shares.noa;
    summary.shares.unassigned += shares.unassigned;
    summary.byState[item.state] += value;
    summary.byCategory[item.category] = (summary.byCategory[item.category] ?? 0) + value;
  }
  return summary;
}

export interface Settlement {
  from: Traveller;
  to: Traveller;
  amount: Agorot;
  /** Costs one paid for the other that count toward it; listed so the amount can be checked. */
  items: Expense[];
  /** What was already given back through settle-ups (either way, in agorot). */
  paidBack: Agorot;
}

const other = (t: Traveller): Traveller => (t === 'dana' ? 'noa' : 'dana');

/**
 * Who still owes whom, like Splitwise: for every cost one of us paid that isn't marked settled,
 * the other owes her own share; every settle-up takes off what the giver owed. Costs with no known
 * payer or shekel value are left out. Null when we are even.
 */
export function settlement(items: Expense[], paid: Payment[] = []): Settlement | null {
  const owed = { dana: 0, noa: 0 }; // owed[x]: what the other one owes x
  const open: Expense[] = [];
  for (const item of items) {
    if (!item.paidBy || item.settled === true) continue;
    const value = toAgorot(item);
    if (value === null) continue;
    const debtor = other(item.paidBy);
    const share = sharesOf(item, value)[debtor];
    if (share === 0) continue;
    owed[item.paidBy] += share;
    open.push(item);
  }
  let paidBack = 0;
  for (const payment of paid) {
    const value = toAgorot(payment);
    if (value === null || payment.from === payment.to) continue;
    owed[payment.to] -= value;
    paidBack += value;
  }
  const net = owed.dana - owed.noa;
  if (net === 0) return null;
  return net > 0
    ? { from: 'noa', to: 'dana', amount: net, items: open, paidBack }
    : { from: 'dana', to: 'noa', amount: -net, items: open, paidBack };
}

const shekel = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const shekelRounded = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

export const formatShekels = (agorot: Agorot) => shekel.format(agorot / 100);
export const formatShekelsRounded = (agorot: Agorot) => shekelRounded.format(agorot / 100);

export function formatOriginal(amount: number, currency: Expense['currency']): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
