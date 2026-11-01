import { dayZones, proximity, restaurants } from '../../data/dining';
import { shoppingFor } from '../../data/shopping';
import type { CustomStop } from './planEdits';
import type { PlanStop } from './stops';

export interface Suggestion extends CustomStop {
  id: string;
}

const MAX_PER_KIND = 4;

/** Loose match, so "T's Tantan" in the plan hides the T's Tantan suggestion. */
export const mentions = (stops: PlanStop[], name: string) => {
  const key = name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  return stops.some((stop) =>
    `${stop.title} ${stop.event?.place ?? ''}`
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, '')
      .includes(key),
  );
};

/**
 * Discover's picks for a day that are not in the plan yet: vegan places in or near the day's
 * area, then the day's shopping picks. Offered when adding or replacing a stop.
 */
export function daySuggestions(date: string, stops: PlanStop[]): Suggestion[] {
  const zone = dayZones[date];
  const food: Suggestion[] = zone
    ? restaurants
        .filter((restaurant) => ['same', 'near'].includes(proximity(restaurant, zone)))
        .filter((restaurant) => !restaurant.booked && !mentions(stops, restaurant.name))
        .slice(0, MAX_PER_KIND)
        .map((restaurant) => ({
          id: `food-${restaurant.id}`,
          title: restaurant.name,
          note: restaurant.food,
          kind: 'food',
        }))
    : [];
  const shops: Suggestion[] = (shoppingFor(date)?.picks ?? [])
    .filter((pick) => !mentions(stops, pick.name))
    .slice(0, MAX_PER_KIND)
    .map((pick) => ({ id: `shop-${pick.name}`, title: pick.name, note: pick.kind, kind: 'shop' }));
  return [...food, ...shops];
}
