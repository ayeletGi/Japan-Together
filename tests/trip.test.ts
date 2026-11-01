import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hotelForNight, hotelList } from '../src/data/hotels';
import { dayRoutes, routeFor } from '../src/data/routes';
import { laundryEvents } from '../src/data/laundry';
import { luggageEvents } from '../src/data/luggage';
import { allEvents, days, getDay, orderedEvents, REMOVED_EVENTS } from '../src/data/trip';
import { DayPage } from '../src/features/itinerary/DayPage';
import { StopSheet } from '../src/features/itinerary/StopSheet';
import { directions, segmentForEvent } from '../src/features/maps/routes';
import '../src/i18n';
import baseline from './fixtures/baseline.json';

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

describe('original plan contract', () => {
  it('keeps all 17 days and every kept source ID in source order', () => {
    const fromSource = (day: { events: { id: string }[] }) =>
      day.events.filter((e) => !e.id.startsWith('laundry-') && !e.id.startsWith('luggage-'));
    const kept = (day: (typeof baseline.days)[number]) =>
      day.events.filter((e) => !REMOVED_EVENTS.has(e.id));
    expect(days.map((d) => d.date)).toEqual(baseline.days.map((d) => d.date));
    for (const day of baseline.days)
      expect(fromSource(getDay(day.date)!).map((e) => e.id)).toEqual(kept(day).map((e) => e.id));
    const keptCount = 89 - REMOVED_EVENTS.size;
    const added = laundryEvents.length + luggageEvents.length;
    expect(allEvents).toHaveLength(keptCount + added);
    expect(new Set(allEvents.map((e) => e.id)).size).toBe(keptCount + added);
  });

  it('puts luggage forwarding on the hotel-change days, never on Shabbat', () => {
    expect(luggageEvents.map((e) => [e.id, e.date])).toEqual([
      ['luggage-narita-sameday', '2037-11-03'],
      ['luggage-to-kobe', '2037-11-04'],
      ['luggage-kobe-osaka', '2037-11-08'],
      ['luggage-to-omori', '2037-11-10'],
      ['luggage-to-oriental', '2037-11-15'],
    ]);
    for (const event of luggageEvents) {
      expect(getDay(event.date)!.events.map((e) => e.id)).toContain(event.id);
      expect(['2037-11-07', '2037-11-14']).not.toContain(event.date);
    }
  });

  it('has lunch at Tokyo Station on the way from Narita, before the check-in', () => {
    const times = Object.fromEntries(getDay('2037-11-03')!.events.map((e) => [e.id, e.time]));
    expect(times['d3-04']).toBe('15:30');
    expect(times['d3-03']).toBe('17:00');
  });

  it('adds weekly laundry on quiet slots, never on Shabbat or at the Omori hotel', () => {
    expect(laundryEvents.map((e) => [e.id, e.date, e.time])).toEqual([
      ['laundry-kobe', '2037-11-08', '07:00'],
      ['laundry-osaka-backup', '2037-11-11', '07:00'],
      ['laundry-oriental', '2037-11-15', '18:45'],
    ]);
    for (const event of laundryEvents) {
      expect(getDay(event.date)!.events.map((e) => e.id)).toContain(event.id);
      expect(['2037-11-07', '2037-11-14']).not.toContain(event.date);
      expect(event.place).not.toMatch(/Omori/);
    }
    expect(getDay('2037-11-08')!.tags).toContain('🧺 כביסה 1/2');
  });

  it('never publishes document references or booking numbers', () => {
    const json = JSON.stringify(days);
    expect(allEvents.some((e) => 'docs' in e)).toBe(false);
    expect(json).not.toMatch(/docs\//);
    expect(json).not.toMatch(/מספר (?:הזמנה|אישור)\s*[:#]?\s*[A-Za-z0-9_]{3,}/);
  });

  it('keeps the critical anchors exactly as booked', () => {
    const at = (id: string) => allEvents.find((e) => e.id === id)!;
    expect(at('d2-01')).toMatchObject({ time: '19:00', status: 'confirmed' });
    expect(at('d4-01')).toMatchObject({ time: '10:00', end: '10:30', status: 'confirmed' });
    expect(at('d5-03')).toMatchObject({ time: '17:19', end: '19:53', status: 'confirmed' });
    expect(at('d9-03')).toMatchObject({ time: '10:30', status: 'confirmed' });
    expect(at('d9-05')).toMatchObject({ time: '18:00', status: 'confirmed' });
    expect(at('d11-04')).toMatchObject({ time: '18:30', end: '20:49', status: 'confirmed' });
    expect(at('d12-04')).toMatchObject({ time: '19:00', end: '20:50', status: 'confirmed' });
    expect(at('d18-03')).toMatchObject({ time: '15:45', status: 'confirmed' });
    for (const id of ['d6-04', 'd7-01', 'd13-05', 'd14-01'])
      expect(at(id).status).toBe('confirmed');
    expect(at('d11-04').note).toContain('8D');
    expect(JSON.stringify(days)).not.toContain('הרכבת האחרונה שצריך להזמין');
  });

  it('orders untimed events sensibly without changing any stored time', () => {
    const dayFive = orderedEvents(getDay('2037-11-05')!).map((e) => e.id);
    expect(dayFive.indexOf('d5-01')).toBeLessThan(dayFive.indexOf('d5-04'));
    const nov18 = orderedEvents(getDay('2037-11-18')!).map((e) => e.id);
    expect(nov18).toEqual(['d18-01', 'd18-02', 'd18-03']);
    expect(allEvents.find((e) => e.id === 'd5-01')!.time).toBeNull();
  });

  it('renders every activity on every day, and its full note in its sheet', () => {
    for (const day of days) {
      const html = renderToStaticMarkup(React.createElement(DayPage, { date: day.date }));
      expect(html.match(/class="plan-row/g) ?? [], day.date).toHaveLength(day.events.length);
      expect(html).not.toContain('docs/');
      for (const event of day.events) {
        // Ranges are wrapped in <bdi dir="ltr"> so they read right in Hebrew; compare the text.
        const sheet = renderToStaticMarkup(
          React.createElement(StopSheet, { date: day.date, stopId: event.id }),
        ).replace(/<\/?bdi[^>]*>/g, '');
        for (const part of event.note.split('**').filter(Boolean))
          expect(sheet, event.id).toContain(escapeHtml(part.slice(0, 40)));
        expect(sheet).not.toContain('docs/');
      }
    }
  });
});

describe('hotels', () => {
  it('keeps five hotels with back-to-back stays and the 15.11 move to Oriental', () => {
    expect(hotelList.map((h) => h.id)).toEqual([
      'shinagawa',
      'kobe',
      'osakaNamba',
      'omori',
      'orientalTokyoBay',
    ]);
    for (let i = 1; i < hotelList.length; i++)
      expect(hotelList[i].checkIn).toBe(hotelList[i - 1].checkOut);
    expect(hotelForNight('2037-11-15')?.id).toBe('orientalTokyoBay');
    expect(hotelForNight('2037-11-02')).toBeUndefined();
    expect(hotelForNight('2037-11-18')).toBeUndefined();
  });
});

describe('real route links', () => {
  it('has a route for every day, continuous leg to leg', () => {
    expect(dayRoutes.map((r) => r.date)).toEqual(days.map((d) => d.date));
    for (const route of dayRoutes) {
      let from = route.start.query;
      for (const segment of route.segments) {
        expect(segment.from, segment.id).toBe(from);
        from = segment.to;
      }
    }
  });

  it('points every leg at an event of that same day', () => {
    for (const route of dayRoutes)
      for (const segment of route.segments)
        if (segment.eventId)
          expect(
            getDay(route.date)!.events.map((e) => e.id),
            segment.eventId,
          ).toContain(segment.eventId);
  });

  it('provides origin, destination and explicit mode for every leg', () => {
    for (const segment of dayRoutes.flatMap((r) => r.segments)) {
      const url = new URL(directions(segment));
      expect(url.pathname).toBe('/maps/dir/');
      expect(url.searchParams.get('origin')).toBe(segment.from);
      expect(url.searchParams.get('destination')).toBe(segment.to);
      expect(url.searchParams.get('travelmode')).toBe(segment.mode);
      expect(url.searchParams.has('waypoints')).toBe(false);
    }
  });

  it('walks on Shabbat and follows the Kyoto day order', () => {
    for (const segment of dayRoutes.flatMap((r) => r.segments))
      if (segment.shabbat) expect(segment.mode).toBe('walking');
    const kyoto = routeFor('2037-11-09')!;
    expect(kyoto.start.label).toBe('CANDEO Osaka Namba');
    expect(kyoto.segments.map((s) => s.eventId)).toEqual([
      'd9-03',
      'gion-walk',
      'd9-04',
      'd9-05',
      'd9-06',
    ]);
    expect(kyoto.segments.at(-1)!.to).toBe('CANDEO HOTELS Osaka Namba');
  });

  it('keeps the 4.11 sample route unchanged', () => {
    expect(routeFor('2037-11-04')!.segments.map((s) => s.eventId)).toEqual(
      getDay('2037-11-04')!
        .events.map((e) => e.id)
        .filter((id) => !id.startsWith('luggage-')), // a front-desk reminder, not a leg
    );
    expect(segmentForEvent({ id: 'shuttle-to-disney-16', date: '2037-11-16' })?.eventId).toBe(
      'd16-01',
    );
  });
});

describe('place names', () => {
  it('translates every city the trip data uses', async () => {
    const { default: i18n, placeName } = await import('../src/i18n');
    const t = i18n.getFixedT('en');
    const untranslated = [
      ...new Set([...days.map((day) => day.city), ...hotelList.map((h) => h.city)]),
    ]
      .map((city) => placeName(city, t))
      .filter((name) => /[֐-׿]/.test(name));
    expect(untranslated).toEqual([]);
    expect(placeName('טוקיו → קובה', t)).toBe('Tokyo → Kobe');
    expect(placeName('טוקיו / דיסני', i18n.getFixedT('he'))).toBe('טוקיו / דיסני');
  });
});
