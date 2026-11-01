import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hotels } from '../src/data/hotels';
import { DeparturesPage } from '../src/features/departures/DeparturesPage';
import { departurePlans } from '../src/data/departures';
import { departureFor, departureMapsUrl } from '../src/features/departures/plans';
import { DayPage } from '../src/features/itinerary/DayPage';
import { toMinutes as minutes } from '../src/lib/time';
// Whitelisted source fields only. audit:source checks this fixture against the private source.
import '../src/i18n';
import events from './fixtures/confirmed-attractions.json';

describe('confirmed attraction departures', () => {
  it('covers every confirmed attraction exactly once, including the six internal USJ entries', () => {
    const confirmed = events.filter(
      (event) => event.status === 'confirmed' && ['ticket', 'activity'].includes(event.kind),
    );
    const covered = departurePlans.flatMap((plan) => [
      plan.eventId,
      ...(plan.internalEvents ?? []).map((event) => event.id),
    ]);
    expect(covered.sort()).toEqual(confirmed.map((event) => event.id).sort());
    expect(new Set(covered).size).toBe(covered.length);
    expect(departurePlans).toHaveLength(6);
    for (const plan of departurePlans) {
      const event = events.find((event) => event.id === plan.eventId)!;
      expect(plan.date).toBe(event.date);
      expect(minutes(plan.leave)).toBeLessThan(minutes(plan.arriveBy));
      if (event.time) expect(minutes(plan.arriveBy)).toBeLessThan(minutes(event.time));
      for (const internal of plan.internalEvents ?? []) {
        const source = events.find((event) => event.id === internal.id)!;
        expect({ time: internal.time, end: internal.end }).toEqual({
          time: source.time,
          end: source.end,
        });
      }
    }
  });
  it('adds recommendations without changing event times or applying them to unconfirmed events', () => {
    expect(departureFor({ id: 'd4-01', status: 'planned' })).toBeUndefined();
    expect(departureFor({ id: 'd4-01', status: 'confirmed' })?.leave).toBe('08:45');
    expect(events.find((event) => event.id === 'd4-01')?.time).toBe('10:00');
    expect(departureFor({ id: 'd10-05', status: 'confirmed' })).toBeUndefined();
    const html = renderToStaticMarkup(React.createElement(DayPage, { date: '2037-11-04' }));
    expect(html.match(/class="plan-row/g) ?? []).toHaveLength(7);
    expect(html).toContain('08:45');
    const overview = renderToStaticMarkup(React.createElement(DeparturesPage));
    expect(overview.match(/class="leave-block"/g) ?? []).toHaveLength(6);
    expect(overview).toContain('שעת פתיחת הפארק ל־10.11 לא אומתה כאן');
  });
  it('links to the correct hotel and venue, with a current-location option for the spa', () => {
    for (const plan of departurePlans) {
      const url = new URL(departureMapsUrl(plan));
      expect(url.origin).toBe('https://www.google.com');
      expect(url.searchParams.get('origin')).toBe(hotels[plan.hotel].mapsQuery);
      expect(url.searchParams.get('destination')).toBe(plan.destination);
      expect(url.searchParams.get('travelmode')).toBe('transit');
    }
    const spa = departurePlans.find((plan) => plan.eventId === 'd12-04')!;
    const nearby = new URL(departureMapsUrl(spa, false));
    expect(nearby.searchParams.has('origin')).toBe(false);
    expect(nearby.searchParams.get('travelmode')).toBe('walking');
    expect(spa.note).toContain('אין צורך לחזור למלון');
  });
  it('departs from the hotel the travellers are actually staying at that night', () => {
    for (const plan of departurePlans) {
      const { checkIn, checkOut } = hotels[plan.hotel];
      expect(plan.date >= checkIn && plan.date < checkOut, plan.eventId).toBe(true);
    }
  });
});
