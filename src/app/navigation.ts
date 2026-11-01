import { CalendarDays, Compass, ListChecks, Sun, Ticket, Wallet } from 'lucide-react';
import type { ComponentType } from 'react';
import { ToriiIcon } from '../components/icons';
import { lastDay } from './lastDay';
import { paths, type Route } from './router';

export type NavId = 'today' | 'discover' | 'schedule' | 'tickets' | 'budget' | 'lists' | 'useful';

export interface NavItem {
  /** Key under `nav.items` in the translations. */
  id: NavId;
  Icon: ComponentType<{ size?: number }>;
  href: () => string;
}

export const navItems: NavItem[] = [
  { id: 'today', Icon: Sun, href: () => paths.day(lastDay()) },
  { id: 'discover', Icon: Compass, href: () => paths.discover() },
  { id: 'schedule', Icon: CalendarDays, href: paths.schedule },
  { id: 'tickets', Icon: Ticket, href: paths.tickets },
  { id: 'budget', Icon: Wallet, href: paths.budget },
  { id: 'lists', Icon: ListChecks, href: paths.lists },
  { id: 'useful', Icon: ToriiIcon, href: paths.useful },
];

/** Which tab a screen belongs to, for the active state. */
export function activeNav(route: Route): NavId {
  switch (route.name) {
    case 'day':
    case 'route':
    case 'departures':
      return 'today';
    case 'discover':
      return 'discover';
    case 'schedule':
      return 'schedule';
    case 'tickets':
      return 'tickets';
    case 'budget':
      return 'budget';
    case 'lists':
      return 'lists';
    case 'useful':
      return 'useful';
  }
}

/** Screens reached from inside a tab (they slide in, and back out). */
const isSubPage = (route: Route) => route.name === 'route' || route.name === 'departures';

export type PageMotion = 'in' | 'forward' | 'back' | 'tab-next' | 'tab-prev';

const tabIndex = (route: Route) => navItems.findIndex(({ id }) => id === activeNav(route));

/**
 * The page transition between two screens: a swoop from the side of the tab you moved to when
 * the tab changes, a slide when going into a sub-page or back out of it, a gentle rise for other
 * screen changes, and nothing when only the day or filter changes.
 */
export function pageMotion(previous: Route | undefined, next: Route): PageMotion | null {
  if (!previous) return 'in';
  const sameTab = activeNav(previous) === activeNav(next);
  if (!sameTab) return tabIndex(next) > tabIndex(previous) ? 'tab-next' : 'tab-prev';
  if (isSubPage(next) && !isSubPage(previous)) return 'forward';
  if (isSubPage(previous) && !isSubPage(next)) return 'back';
  return previous.name === next.name ? null : 'in';
}
