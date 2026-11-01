import { paths } from '../../app/router';
import { shoppingFor } from '../../data/shopping';
import type { TripEvent } from '../../data/types';
import { eventCategory, isConfirmed } from './eventDisplay';

export type RecommendationKind = 'mealAlternatives' | 'food' | 'shopping' | 'gyms';

export interface RecommendationLink {
  kind: RecommendationKind;
  href: string;
}

/**
 * The Discover page that fits an event: other restaurants for a meal, the day's shopping picks
 * for shop stops and walks, the gym list for a workout, and food around the day for the rest.
 * Flights and laundry get nothing: there is nowhere to go from the plane or the washing machine.
 */
export function recommendationFor(event: TripEvent): RecommendationLink | null {
  const category = eventCategory(event);
  if (category === 'flight' || category === 'laundry') return null;
  if (category === 'food') {
    return {
      kind: isConfirmed(event) ? 'food' : 'mealAlternatives',
      href: paths.discover('food', { date: event.date, eventId: event.id }),
    };
  }
  if (category === 'gym') return { kind: 'gyms', href: paths.discover('gyms') };
  if ((category === 'shop' || category === 'activity') && shoppingFor(event.date)) {
    return { kind: 'shopping', href: paths.discover('shopping', { date: event.date }) };
  }
  return { kind: 'food', href: paths.discover('food', { date: event.date }) };
}
