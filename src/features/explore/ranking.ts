import { proximity, type Restaurant, type ZoneId } from '../../data/dining';

export type SortChoice = 'nearby' | 'rating';

const proximityRank = { same: 0, near: 1, city: 2, other: 3 };

/** Restaurants for a meal or day, nearest area first; ties keep the planned place first. */
export function rankRestaurants(
  list: Restaurant[],
  zone: ZoneId | undefined,
  sort: SortChoice,
  plannedId?: string,
): Restaurant[] {
  return [...list].sort((a, b) => {
    if (sort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1);
    const byArea = proximityRank[proximity(a, zone)] - proximityRank[proximity(b, zone)];
    if (byArea) return byArea;
    if (a.id === plannedId) return -1;
    if (b.id === plannedId) return 1;
    return 0;
  });
}
