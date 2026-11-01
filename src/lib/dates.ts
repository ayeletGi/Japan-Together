import type { Language } from '../i18n';
import { JAPAN_TZ, japanNoon } from './time';

const intlLocales: Record<Language, string> = { he: 'he-IL', en: 'en-GB' };

const formatters = new Map<string, Intl.DateTimeFormat>();

/** One cached formatter per language + options, always in Japan time. */
function format(date: string, lang: Language, options: Intl.DateTimeFormatOptions): string {
  const key = `${lang}:${JSON.stringify(options)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocales[lang], { ...options, timeZone: JAPAN_TZ });
    formatters.set(key, formatter);
  }
  return formatter.format(japanNoon(date));
}

/** "יום רביעי, 4 בנובמבר 2037" / "Wednesday 4 November 2026" */
export const formatFullDate = (date: string, lang: Language = 'he') =>
  format(date, lang, { dateStyle: 'full' });

/** "יום רביעי, 4 בנובמבר" / "Wednesday 4 November" */
export const formatWeekdayDayMonth = (date: string, lang: Language = 'he') =>
  format(date, lang, { day: 'numeric', month: 'long', weekday: 'long' });

/** "רביעי" (without the "יום" prefix) / "Wed", for compact chips */
export const formatShortWeekday = (date: string, lang: Language = 'he') =>
  lang === 'he'
    ? format(date, lang, { weekday: 'long' }).replace(/^יום /, '')
    : format(date, lang, { weekday: 'short' });

/** Day of month as a number, e.g. 4 */
export const dayOfMonth = (date: string) => Number(date.slice(8, 10));

/** "4 בנובמבר" / "4 November" */
export const formatDayMonth = (date: string, lang: Language = 'he') =>
  format(date, lang, { day: 'numeric', month: 'long' });

/** "2037-10-13" → "13.10.2026", for "checked on" and rate dates. */
export const formatDotted = (date: string) => date.split('-').reverse().join('.');

/** "ד׳" / "Wed", for the day chips */
export const formatWeekdayLetter = (date: string, lang: Language = 'he') =>
  format(date, lang, { weekday: lang === 'he' ? 'narrow' : 'short' });

/** "2037-11-03" → "3.11", for short date pills and ranges. */
export const formatDayDot = (date: string) =>
  `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;
