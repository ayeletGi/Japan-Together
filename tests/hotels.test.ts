import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hotelList, hotels } from '../src/data/hotels';
import { getDay, tripDates } from '../src/data/trip';
import { HotelSheet } from '../src/features/hotels/HotelSheet';
import { hotelOfEvent, nightDates } from '../src/features/hotels/hotelStays';
import '../src/i18n';

describe('hotel sheet', () => {
  it('shows the Japanese name for the taxi and every night as a pill', () => {
    const html = renderToStaticMarkup(React.createElement(HotelSheet, { hotelId: 'kobe' }));
    expect(html).toContain(hotels.kobe.jpName);
    expect(html).toContain('lang="ja"');
    expect(nightDates(hotels.kobe)).toEqual(['2037-11-05', '2037-11-06', '2037-11-07']);
    for (const night of ['5.11', '6.11', '7.11']) expect(html).toContain(`>${night}</bdi>`);
    expect(html).not.toContain('>8.11</bdi></button>');
    expect(html).toContain('3 לילות');
  });

  it('gives every hotel the id it is listed under, so its sheet opens', () => {
    for (const hotel of hotelList) expect(hotels[hotel.id].id).toBe(hotel.id);
  });

  it('counts each night once across the whole trip', () => {
    const all = hotelList.flatMap(nightDates);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(15);
  });

  it('finds the hotel of every check-in, check-out and luggage stop', () => {
    const hotelStops = tripDates
      .flatMap((date) => getDay(date)?.events ?? [])
      .filter((event) => event.kind === 'hotel' || /מזוודות|luggage/i.test(event.title))
      .filter((event) => !/Airport/.test(event.place)); // sent from the airport counter, not a hotel
    expect(hotelStops.length).toBeGreaterThanOrEqual(hotelList.length * 2);
    for (const event of hotelStops) expect(hotelOfEvent(event), event.title).toBeDefined();
  });
});
