import { useEffect, useState } from 'react';
import { defaultDate, isTripDate } from '../data/trip';

/**
 * Hash routing, so deep links and refreshes work on any static host (the artifact page, the
 * one-file offline copy) without server rewrites.
 *   #/day/2037-11-04          → Today (that day's plan and stamp rally)
 *   #/day/2037-11-04/route    → that day's route
 *   #/departures              → departure advice for all confirmed attractions
 *   #/schedule                → the whole trip on one screen
 *   #/discover/food?date=…    → restaurants (also shopping, gyms, laundry), optionally for a day or meal
 *   #/tickets                 → every booking, by date
 *   #/budget                  → the budget
 *   #/lists/flight            → our shared lists (before the flight, to pack, gifts, our own);
 *                               without an id, the one last opened on this phone
 *   #/useful                  → checklist, yen converter, emergency numbers, taxi card, phrases
 * Links from the old layout (#/more/…) still open the screen that took their place.
 */
export const discoverTabs = ['food', 'shopping', 'gyms', 'laundry'] as const;
export type DiscoverTab = (typeof discoverTabs)[number];

export type Route =
  | { name: 'day'; date: string }
  | { name: 'route'; date: string }
  | { name: 'departures' }
  | { name: 'schedule'; focus?: 'hotels' }
  | { name: 'discover'; tab: DiscoverTab; date?: string; eventId?: string }
  | { name: 'tickets' }
  | { name: 'budget' }
  | { name: 'lists'; list?: string }
  | { name: 'useful' };

export const paths = {
  day: (date: string) => `#/day/${date}`,
  route: (date: string) => `#/day/${date}/route`,
  departures: () => '#/departures',
  schedule: () => '#/schedule',
  discover: (tab: DiscoverTab = 'food', options: { date?: string; eventId?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.date) params.set('date', options.date);
    if (options.eventId) params.set('event', options.eventId);
    const query = params.toString();
    return `#/discover/${tab}${query ? `?${query}` : ''}`;
  },
  tickets: () => '#/tickets',
  budget: () => '#/budget',
  lists: (list?: string) => (list ? `#/lists/${list}` : '#/lists'),
  useful: () => '#/useful',
};

/** Screens of the old layout and where they live now. */
const legacyRoutes: Record<string, Route> = {
  '#/more': { name: 'useful' },
  '#/more/yen': { name: 'useful' },
  '#/more/settings': { name: 'useful' },
  '#/more/budget': { name: 'budget' },
  '#/gifts': { name: 'lists' },
  '#/more/hotels': { name: 'schedule', focus: 'hotels' },
};

const isDiscoverTab = (value: string): value is DiscoverTab =>
  (discoverTabs as readonly string[]).includes(value);

export function parseRoute(hash: string, now: Date = new Date()): Route {
  const [path, query = ''] = hash.split('?');
  const params = new URLSearchParams(query);

  if (path === paths.departures()) return { name: 'departures' };
  if (path === paths.schedule()) return { name: 'schedule' };
  if (path === paths.tickets()) return { name: 'tickets' };
  if (path === paths.budget()) return { name: 'budget' };
  if (path === paths.lists()) return { name: 'lists' };
  const list = /^#\/lists\/([\w-]{1,80})$/.exec(path);
  if (list) return { name: 'lists', list: list[1] };
  if (path === paths.useful()) return { name: 'useful' };
  if (legacyRoutes[path]) return legacyRoutes[path];

  const discover = /^#\/discover(?:\/([a-z]+))?$/.exec(path);
  if (discover && (!discover[1] || isDiscoverTab(discover[1]))) {
    const date = params.get('date') ?? undefined;
    return {
      name: 'discover',
      tab: (discover[1] as DiscoverTab | undefined) ?? 'food',
      date: date && isTripDate(date) ? date : undefined,
      eventId: params.get('event') ?? undefined,
    };
  }

  const day = /^#\/day\/(\d{4}-\d{2}-\d{2})(\/route)?$/.exec(path);
  if (day && isTripDate(day[1])) return { name: day[2] ? 'route' : 'day', date: day[1] };

  return { name: 'day', date: defaultDate(now) };
}

export function useHashRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return parseRoute(hash);
}
