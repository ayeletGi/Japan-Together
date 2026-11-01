import { describe, expect, it } from 'vitest';
import {
  Bus,
  Castle,
  Flame,
  Landmark,
  Luggage,
  Salad,
  Sandwich,
  Soup,
  WashingMachine,
} from 'lucide-react';
import { KimonoIcon } from '../src/components/icons';
import { attractionIcon } from '../src/features/itinerary/attractionIcons';
import type { TripEvent } from '../src/data/types';

const event = (title: string, place = '', kind: TripEvent['kind'] = 'activity') =>
  ({ id: 'x', title, place, kind, note: '', date: '2037-11-03', status: 'planned' }) as TripEvent;

describe('attractionIcon', () => {
  it('picks the thing itself, not just the category', () => {
    expect(attractionIcon(event('Vegan Ramen UZU Tokyo', '', 'food'))).toBe(Soup);
    expect(attractionIcon(event('Tokyo Disneyland — יום פארק', '', 'ticket'))).toBe(Castle);
    expect(attractionIcon(event('Kimono Rental MOMO (Gion)', '', 'ticket'))).toBe(KimonoIcon);
    expect(attractionIcon(event('ארוחת ליל שבת — חב״ד קובה', '', 'shabbat'))).toBe(Flame);
  });

  it('lets transfers and chores win over the place they go to', () => {
    expect(attractionIcon(event('🚌 שאטל מלון → Disneyland', '', 'transport'))).toBe(Bus);
    expect(attractionIcon(event('אוכל שהכנתן מראש', 'Tokyo Disneyland picnic area', 'food'))).toBe(
      Sandwich,
    );
    expect(attractionIcon(event('כביסה / הכנות שבת'))).toBe(WashingMachine);
    expect(attractionIcon(event('צ׳ק־אאוט מ־Shinagawa Prince', '', 'hotel'))).toBe(Luggage);
  });
});

describe('attractionIcon with a place that names another attraction', () => {
  it('trusts the title first', () => {
    expect(
      attractionIcon(
        event(
          'Vegan Ramen UZU Tokyo — ארוחת צהריים',
          'Vegan Ramen UZU Tokyo teamLab Planets',
          'food',
        ),
      ),
    ).toBe(Soup);
  });
});

describe('attractionIcon for meals in a sightseeing area', () => {
  it('shows food, not the neighbourhood', () => {
    expect(attractionIcon(event('ZIRAEL — ארוחת צהריים בגיון', '', 'food'))).toBe(Salad);
    expect(attractionIcon(event('סיבוב בגיון עם הקימונו — Hanamikoji'))).toBe(Landmark);
  });
});
