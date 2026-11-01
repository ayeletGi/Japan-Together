import { routeFor, sharedLegs } from '../../data/routes';
import type { RouteSegment, TripEvent } from '../../data/types';
import { directionsUrl } from '../../lib/maps';

export function directions(segment: RouteSegment): string {
  return directionsUrl({ origin: segment.from, destination: segment.to, mode: segment.mode });
}

/** The leg that arrives at the given event on its day. */
export function segmentForEvent(event: Pick<TripEvent, 'id' | 'date'>): RouteSegment | undefined {
  const id = sharedLegs[event.id] ?? event.id;
  return routeFor(event.date)?.segments.find((segment) => segment.eventId === id);
}
