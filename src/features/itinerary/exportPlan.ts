import type { TFunction } from 'i18next';
import { hotelForNight } from '../../data/hotels';
import { eventTimeZone, getDay, TRIP } from '../../data/trip';
import type { TripDay } from '../../data/types';
import { placeName, type Language } from '../../i18n';
import { formatWeekdayDayMonth } from '../../lib/dates';
import { daysBetween, ISRAEL_TZ } from '../../lib/time';
import { applyPlanEdits, NO_EDITS, type PlanEdits } from './planEdits';
import type { PlanStop } from './stops';

/** One day as it is exported: the day, its stops as Today shows them, and where we sleep. */
export interface ExportDay {
  day: TripDay;
  stops: PlanStop[];
  hotel?: string;
}

/** The days to export, with this phone's plan edits applied, so the export matches the screen. */
export function exportDays(dates: string[], edits: PlanEdits): ExportDay[] {
  return dates.map((date) => {
    const day = getDay(date)!;
    return {
      day,
      stops: applyPlanEdits(day, edits[date] ?? NO_EDITS),
      hotel: hotelForNight(date)?.name,
    };
  });
}

/** "Day 4 of 17 · Wednesday 4 November · Tokyo" */
export function dayHeading({ day }: ExportDay, t: TFunction, lang: Language): string {
  const number = daysBetween(TRIP.start, day.date) + 1;
  return [
    t('today.dayOf', { number, total: TRIP.dayCount }),
    formatWeekdayDayMonth(day.date, lang),
    placeName(day.city, t),
  ].join(' · ');
}

/** The stop's clock, marked when it is not Japan time (the outbound flight). */
export function stopTime(stop: PlanStop, t: TFunction): string {
  if (!stop.time) return t('plan.noTime');
  const israel = stop.event && eventTimeZone(stop.event) === ISRAEL_TZ;
  return israel ? `${stop.time} ${t('time.israelClock')}` : stop.time;
}

/** Notes squashed onto one line: the source notes use " | " and line breaks as separators. */
const oneLine = (text: string) =>
  text
    .split(/\s*(?:\n|\|)\s*/)
    .filter(Boolean)
    .join(' · ');

/** The extras after a stop: when to leave, and that it is booked. */
function stopExtras(stop: PlanStop, t: TFunction): string[] {
  return [
    stop.leave ? `${t('plan.leaveAt')}${stop.leave.leave}` : '',
    stop.pinned ? t('plan.pinned') : '',
  ].filter(Boolean);
}

/** Plain text to paste into an AI chat: a short intro, then each day with its stops. */
export function planText(days: ExportDay[], t: TFunction, lang: Language): string {
  const blocks = days.map((exported) => {
    const { day, stops, hotel } = exported;
    const lines = [`## ${dayHeading(exported, t, lang)}`];
    if (day.route) lines.push(`${t('export.route')}: ${day.route}`);
    if (hotel) lines.push(`${t('export.hotel')}: ${hotel}`);
    for (const stop of stops) {
      const extras = stopExtras(stop, t);
      const note = oneLine(stop.note);
      lines.push(
        `- ${stopTime(stop, t)} · ${stop.title}${extras.length ? ` (${extras.join(', ')})` : ''}`,
      );
      if (note) lines.push(`  ${note}`);
    }
    return lines.join('\n');
  });
  return [t('export.aiIntro'), ...blocks].join('\n\n') + '\n';
}

/** A CSV cell, quoted when it holds a comma, quote or line break. */
const COLUMNS = ['date', 'day', 'city', 'time', 'stop', 'notes', 'leave', 'hotel'] as const;

const cell = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/**
 * A spreadsheet of every stop, one row each. Excel opens CSV directly; the byte-order mark tells it
 * the file is UTF-8, so the Hebrew shows correctly.
 */
export function planCsv(days: ExportDay[], t: TFunction, lang: Language): string {
  const header = COLUMNS.map((key) => t(`export.columns.${key}`));
  const rows = days.flatMap(({ day, stops, hotel }) =>
    stops.map((stop) => [
      day.date,
      formatWeekdayDayMonth(day.date, lang),
      placeName(day.city, t),
      stopTime(stop, t),
      stop.title,
      oneLine(stop.note),
      stop.leave?.leave ?? '',
      hotel ?? '',
    ]),
  );
  return '﻿' + [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

/** "japan-plan-2037-11-05.csv" for one day, "japan-plan.csv" for the whole trip. */
export const exportFileName = (date: string | undefined, extension: string) =>
  `japan-plan${date ? `-${date}` : ''}.${extension}`;
