import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { eventPresentation } from '../src/data/presentation';
import { allEvents, getDay } from '../src/data/trip';
import type { TripEvent } from '../src/data/types';
import { DayChips } from '../src/features/itinerary/DayChips';
import { DayPage } from '../src/features/itinerary/DayPage';
import {
  cleanTitle,
  eventCategory,
  pendingStatus,
  statusKey,
} from '../src/features/itinerary/eventDisplay';
import '../src/i18n';

const base = getDay('2037-11-04')!.events[0];
const event = (overrides: Partial<TripEvent>): TripEvent => ({ ...base, ...overrides });

describe('event display rules', () => {
  it('derives the category from kind, IDs and source', () => {
    expect(eventCategory(event({ kind: 'food' }))).toBe('food');
    expect(eventCategory(event({ id: 'gym-2037-11-04', kind: 'activity' }))).toBe('gym');
    expect(eventCategory(event({ id: 'shop-itoya-ginza', kind: 'activity' }))).toBe('shop');
    expect(eventCategory(event({ kind: 'ticket' }))).toBe('ticket');
    expect(eventCategory(event({ id: 'd4-03', kind: 'activity', source: 'plan' }))).toBe(
      'activity',
    );
    expect(
      eventCategory(
        event({ id: 'sekaido-shinjuku', kind: 'activity', source: 'shopping-recommendations' }),
      ),
    ).toBe('shop');
    expect(eventCategory(event({ kind: 'train' }))).toBe('train');
    expect(eventCategory(event({ kind: 'shabbat' }))).toBe('shabbat');
  });

  it('labels optional gyms differently from other unconfirmed plans', () => {
    expect(pendingStatus(event({ id: 'gym-2037-11-04', kind: 'activity' }))).toBe('optional');
    expect(pendingStatus(event({ id: 'd4-02', kind: 'food' }))).toBe('planned');
  });

  it('never claims "confirmed for both" for the single flight receipt', () => {
    const at = (id: string) => allEvents.find((e) => e.id === id)!;
    expect(statusKey(at('d12-04'))).toBe('confirmedBoth');
    expect(statusKey(at('d2-01'))).toBe('confirmed');
    expect(statusKey(at('d5-03'))).toBe('confirmedBoth');
    expect(statusKey(at('d12-03'))).toBe('needsCheck');
    // Getting to the airport is a must-not-miss stop; the limousine is booked in the live changes.
    expect(statusKey(at('d18-02'))).toBe('confirmedBoth');
    expect(statusKey({ ...at('d18-02'), status: 'todo' })).toBe('toArrange');
  });

  it("cleans the original plan's decoration from titles", () => {
    expect(cleanTitle('⭐ המלצה שלי: Ginza Itoya')).toBe('Ginza Itoya');
    expect(cleanTitle('🚄 NOZOMI 46')).toBe('NOZOMI 46');
  });

  it('keeps display copy for every event of the sample day', () => {
    for (const { id } of getDay('2037-11-04')!.events)
      expect(eventPresentation[id], id).toBeDefined();
    for (const id of Object.keys(eventPresentation))
      expect(
        allEvents.some((e) => e.id === id),
        id,
      ).toBe(true);
  });
});

describe('Today', () => {
  it('shows all 17 days as chips with the chosen one marked', () => {
    const html = renderToStaticMarkup(React.createElement(DayChips, { selected: '2037-11-04' }));
    expect(html.match(/class="day-chip"/g)).toHaveLength(17);
    expect(html.match(/aria-current="date"/g)).toHaveLength(1);
    expect(html).toContain('href="#/day/2037-11-18"');
  });

  it('lists every stop of the day with Israel times, leave pills, tickets and pins', () => {
    const html = renderToStaticMarkup(React.createElement(DayPage, { date: '2037-11-04' }));
    expect(html.match(/class="plan-row/g)).toHaveLength(getDay('2037-11-04')!.events.length);
    expect(html).toContain('יום 3 מתוך 17');
    expect(html).toContain('אוסף החותמות של היום');
    expect(html).toContain('צאו ב־');
    expect(html).toContain('08:45');
    expect(html).toContain('01:45'); // 08:45 in Japan is 01:45 in Israel
    expect(html).toContain('בישראל');
    expect(html).toContain('📌');
    expect(html).not.toMatch(/צאו מהמלון בעוד(?! )/);
  });
});

describe('recommendation links', () => {
  it('points every card except flights at the matching Discover tab', async () => {
    const { recommendationFor } = await import('../src/features/itinerary/recommendations');
    expect(recommendationFor(event({ kind: 'flight' }))).toBeNull();
    expect(recommendationFor(event({ id: 'gym-2037-11-04', kind: 'activity' }))?.kind).toBe('gyms');
    expect(
      recommendationFor(event({ id: 'shop-itoya-ginza', kind: 'activity', date: '2037-11-04' })),
    ).toEqual({ kind: 'shopping', href: '#/discover/shopping?date=2037-11-04' });
    expect(recommendationFor(event({ kind: 'food', status: 'planned' }))?.kind).toBe(
      'mealAlternatives',
    );
    expect(recommendationFor(event({ kind: 'ticket', date: '2037-11-06' }))).toEqual({
      kind: 'food',
      href: '#/discover/food?date=2037-11-06',
    });
  });
});

describe('where the rally cat stands', () => {
  it('starts on the first stop, walks one stop per stamp and stays on the last when done', async () => {
    const { catStop, catShare } = await import('../src/features/itinerary/rallyGeometry');
    expect([0, 1, 2, 3, 4].map((reached) => catStop(4, reached))).toEqual([1, 2, 3, 4, 4]);
    expect([0, 1, 2, 3, 4].map((reached) => catShare(4, reached))).toEqual([0, 1 / 3, 2 / 3, 1, 1]);
    expect([catShare(1, 0), catShare(1, 1)]).toEqual([0, 1]);
  });
});
