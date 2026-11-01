import { defaultDate, isTripDate } from '../data/trip';
import { PREFIX } from '../lib/storage';

const KEY = `${PREFIX}lastDay`;

/**
 * The day last opened in this tab, so the Today tab and "back to our day" return to it. Kept in
 * sessionStorage: a fresh visit (say, the next morning) opens on the real today again.
 */
export function rememberDay(date: string) {
  try {
    sessionStorage.setItem(KEY, date);
  } catch {
    // Storage unavailable; the Today tab falls back to today.
  }
}

export function lastDay(): string {
  try {
    const date = sessionStorage.getItem(KEY);
    if (date && isTripDate(date)) return date;
  } catch {
    // Storage unavailable.
  }
  return defaultDate();
}
