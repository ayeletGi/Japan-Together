import { afterEach, describe, expect, it } from 'vitest';
import { expenses } from '../src/data/budget';
import { photoFolderFor } from '../src/data/dayFolders';
import { liveChanges, setLiveChanges, type LiveChanges } from '../src/data/live';
import seed from '../src/data/live-seed.json';
import { routeFor } from '../src/data/routes';
import { allEvents, getDay, getEvent, REMOVED_EVENTS } from '../src/data/trip';
import type { TripEvent } from '../src/data/types';
import { eventDisplay } from '../src/features/itinerary/eventDisplay';

const base = seed as LiveChanges;
afterEach(() => setLiveChanges({ ...base, version: -1 }));

const dinner: TripEvent = {
  id: 'live-ramen',
  title: 'Ramen',
  time: '20:00',
  end: null,
  date: '2037-11-03',
  city: 'טוקיו',
  status: 'planned',
  kind: 'meal',
  place: 'Ramen place Tokyo',
  note: '',
  source: 'live',
  priority: false,
  special: null,
};

describe('live changes', () => {
  it('starts from the corrections that moved out of the code', () => {
    expect(liveChanges().events['d3-04'].time).toBe('15:30');
    expect(getEvent('d3-04')!.time).toBe('15:30');
    expect(REMOVED_EVENTS.has('gym-2037-11-12')).toBe(true);
    expect(getEvent('gym-2037-11-12')).toBeUndefined();
  });

  it('swaps a restaurant everywhere at once: the day, the route, the card', () => {
    const before = routeFor('2037-11-03')!.segments.find((s) => s.eventId === 'd3-05')!;
    expect(before.toLabel).toBe('TSUMINAKI');

    const swapped = setLiveChanges({
      ...base,
      version: 5,
      events: {
        ...base.events,
        'd3-05': {
          title: 'Vegan Ramen Shibuya',
          place: 'Vegan Ramen Shibuya Tokyo',
          placeLabel: 'Vegan Ramen',
          displayTitle: 'ראמן טבעוני בשיבויה',
          displayDescription: 'החלפנו את TSUMINAKI.',
        },
      },
    });
    expect(swapped).toBe(true);

    const event = getDay('2037-11-03')!.events.find((e) => e.id === 'd3-05')!;
    expect(event.place).toBe('Vegan Ramen Shibuya Tokyo');
    expect(eventDisplay(event).title).toBe('ראמן טבעוני בשיבויה');
    const segments = routeFor('2037-11-03')!.segments;
    const index = segments.findIndex((s) => s.eventId === 'd3-05');
    expect(segments[index]).toMatchObject({
      to: 'Vegan Ramen Shibuya Tokyo',
      toLabel: 'Vegan Ramen',
    });
    expect(segments[index + 1]).toMatchObject({ from: 'Vegan Ramen Shibuya Tokyo' });
  });

  it('adds activities, costs and photo folders, and ignores the same version twice', () => {
    const count = allEvents.length;
    const next = {
      ...base,
      version: 6,
      added: { [dinner.id]: dinner },
      expenses: {
        'live-ramen': {
          title: 'ראמן',
          category: 'food' as const,
          currency: 'JPY' as const,
          amount: 3000,
          owner: 'both' as const,
          state: 'paid' as const,
        },
      },
      photoFolders: { '2037-11-03': { url: 'https://drive.google.com/drive/folders/x' } },
    };
    expect(setLiveChanges(next)).toBe(true);
    expect(setLiveChanges(next)).toBe(false);
    expect(allEvents).toHaveLength(count + 1);
    expect(getDay('2037-11-03')!.events.map((e) => e.id)).toContain('live-ramen');
    expect(expenses.find((e) => e.id === 'live-ramen')?.amount).toBe(3000);
    expect(photoFolderFor('2037-11-03')).toBe('https://drive.google.com/drive/folders/x');
  });

  it('refuses something that is not a set of changes', () => {
    expect(setLiveChanges({ version: 9 })).toBe(false);
    expect(setLiveChanges(null)).toBe(false);
  });
});

describe('a copy with entries the app could not show', () => {
  it('skips just those entries and keeps the rest', () => {
    const accepted = setLiveChanges({
      ...base,
      version: 7,
      events: { ...base.events, 'd3-05': { time: '25:00' }, 'd4-02': { note: 'ok' } },
      added: { 'live-x': { id: 'live-x', title: 'no other fields' } },
      expenses: {
        'live-half': { title: 'no amount', category: 'food' },
        flight: { note: 'an edit of a planned cost needs no other field' },
      },
    });
    expect(accepted).toBe(true);
    expect(liveChanges().events['d3-05']).toBeUndefined();
    expect(getEvent('d4-02')!.note).toBe('ok');
    expect(getEvent('live-x')).toBeUndefined();
    // An incomplete new cost is left out instead of breaking the totals.
    expect(expenses.some((expense) => expense.id === 'live-half')).toBe(false);
    expect(expenses.find((expense) => expense.id === 'flight')?.note).toBe(
      'an edit of a planned cost needs no other field',
    );
  });

  it('shows a renamed activity by its new name', () => {
    setLiveChanges({
      ...base,
      version: 8,
      events: { ...base.events, 'd4-02': { title: '🍜 Afuri Ramen' } },
    });
    // d4-02 has card copy written for its old name in presentation.ts.
    expect(eventDisplay(getEvent('d4-02')!).title).toBe('Afuri Ramen');
  });
});
