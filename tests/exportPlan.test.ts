import { describe, expect, it } from 'vitest';
import { tripDates } from '../src/data/trip';
import {
  exportDays,
  exportFileName,
  planCsv,
  planText,
} from '../src/features/itinerary/exportPlan';
import { NO_EDITS } from '../src/features/itinerary/planEdits';
import i18n from '../src/i18n';

const t = i18n.t;

describe('plan export', () => {
  it('writes one day as text for an AI chat, with its stops in order', () => {
    const [day] = exportDays(['2037-11-05'], {});
    const text = planText([day], t, 'he');
    expect(text.startsWith(t('export.aiIntro'))).toBe(true);
    expect(text).toContain('## יום 4 מתוך 17');
    expect(text).toContain(`${t('export.hotel')}: ${day.hotel}`);
    const positions = day.stops.map((stop) => text.indexOf(stop.title));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('marks the outbound flight as Israel time', () => {
    const text = planText(exportDays([tripDates[0]], {}), i18n.getFixedT('en'), 'en');
    expect(text).toMatch(/19:00 Israel time/);
  });

  it('includes this phone’s plan edits', () => {
    const edits = {
      '2037-11-05': {
        ...NO_EDITS,
        added: [{ id: 'x', time: '21:00', title: 'ראמן', note: '', kind: 'food' as const }],
      },
    };
    expect(planText(exportDays(['2037-11-05'], edits), t, 'he')).toContain('21:00 · ראמן');
  });

  it('exports the whole trip as a CSV with a header and one row per stop', () => {
    const days = exportDays(tripDates, {});
    const csv = planCsv(days, t, 'he');
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.trimEnd().split('\r\n');
    const stops = days.reduce((sum, day) => sum + day.stops.length, 0);
    expect(lines).toHaveLength(stops + 1);
    expect(lines[0]).toBe('﻿תאריך,יום,עיר,שעה,תחנה,הערות,יציאה,לינה');
  });

  it('quotes CSV cells that hold commas, quotes or line breaks', () => {
    const edits = {
      '2037-11-05': {
        ...NO_EDITS,
        added: [{ id: 'x', time: '21:00', title: 'ראמן, "טוב"', note: '', kind: 'food' as const }],
      },
    };
    expect(planCsv(exportDays(['2037-11-05'], edits), t, 'he')).toContain('"ראמן, ""טוב"""');
  });

  it('names the file by day or for the whole trip', () => {
    expect(exportFileName('2037-11-05', 'csv')).toBe('japan-plan-2037-11-05.csv');
    expect(exportFileName(undefined, 'csv')).toBe('japan-plan.csv');
  });
});
