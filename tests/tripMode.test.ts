import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DayPage } from '../src/features/itinerary/DayPage';
import { UsefulPage } from '../src/features/useful/UsefulPage';
import '../src/i18n';

const renderAt = (iso: string, element: React.ReactElement) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
  return renderToStaticMarkup(element);
};

afterEach(() => {
  vi.useRealTimers();
});

describe('before the trip and during it', () => {
  it('before the flight: the hint shows on Today, and the checklist lives in Lists (not Today or Useful)', () => {
    const today = renderAt(
      '2037-10-15T10:00:00+03:00',
      React.createElement(DayPage, { date: '2037-11-04' }),
    );
    expect(today).toContain('trip-hint');
    expect(today).not.toContain('checklist-card');
    const useful = renderAt('2037-10-15T10:00:00+03:00', React.createElement(UsefulPage));
    expect(useful).not.toContain('checklist-card');
  });

  it('in Japan: no hint, no checklist, and the cat follows the clock', () => {
    // 4 November, 13:00 in Japan: teamLab (10:00) and lunch (12:30) are behind us.
    const today = renderAt(
      '2037-11-04T13:00:00+09:00',
      React.createElement(DayPage, { date: '2037-11-04' }),
    );
    expect(today).not.toContain('trip-hint');
    expect(today).not.toContain('checklist-card');
    expect((today.match(/plan-stamp is-done/g) ?? []).length).toBeGreaterThanOrEqual(2);
    const useful = renderAt('2037-11-04T13:00:00+09:00', React.createElement(UsefulPage));
    expect(useful).not.toContain('checklist-card');
    expect(useful).toContain('המלון של הלילה');
  });
});
