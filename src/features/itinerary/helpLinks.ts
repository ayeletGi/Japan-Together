import { dayZones, proximity, restaurants, type Restaurant } from '../../data/dining';
import { hotelForMorning } from '../../data/hotels';
import { inVenueEvents } from '../../data/routes';
import { shoppingFor, type ShopPick } from '../../data/shopping';
import type { TripEvent } from '../../data/types';
import { eventEnd, googleCalendarUrl } from '../../lib/calendar';
import { directionsUrl, searchUrl } from '../../lib/maps';
import type { PlanStop } from './stops';

/** Where a stop is, for Maps: the event's own place, or the name of something we added. */
const stopPlace = (stop: PlanStop) => stop.event?.place ?? stop.title;

/** The calendar entry for a stop at its shown time (edits included). */
function stopEvent(stop: PlanStop): TripEvent {
  return {
    ...(stop.event ?? {
      id: stop.id,
      date: stop.date,
      city: '',
      status: 'planned',
      kind: 'activity',
      source: 'plan',
      priority: false,
      special: null,
      end: null,
    }),
    title: stop.event?.title ?? stop.title,
    note: stop.event?.note ?? stop.note,
    place: stopPlace(stop),
    time: stop.time,
    end: stop.edit === 'moved' || !stop.event ? null : stop.event.end,
  };
}

export interface HelpAround {
  /** Transit directions from the previous stop, or from the morning's hotel for the first one. */
  directions?: { url: string; from?: string };
  /** Up to two vegan places near the day's area; empty means "search near the stop". */
  food: Restaurant[];
  foodSearch: string;
  shops: ShopPick[];
  konbini: string;
  /** Untimed stops become all-day entries (start and end null). */
  calendar?: { url: string; start: string | null; end: string | null };
}

/**
 * The "help around the stop" links in the stop sheet: how to get there, food and shops nearby,
 * a konbini, and adding it to the calendar (in Japan time).
 */
export function helpAround(stops: PlanStop[], index: number): HelpAround {
  const stop = stops[index];
  const place = stopPlace(stop);
  const previous = stops[index - 1];
  const hotel = hotelForMorning(stop.date);
  const origin = previous ? stopPlace(previous) : hotel?.mapsQuery;
  const insideVenue = stop.event && inVenueEvents.has(stop.event.id);

  const zone = dayZones[stop.date];
  const food = zone
    ? restaurants
        .filter((restaurant) => !restaurant.eventIds.includes(stop.id))
        .filter((restaurant) => ['same', 'near'].includes(proximity(restaurant, zone)))
        .slice(0, 2)
    : [];

  const event = stopEvent(stop);
  const calendar = stop.event?.calendarDisabled
    ? undefined
    : {
        url: googleCalendarUrl(event),
        start: stop.time,
        end: stop.time ? eventEnd({ ...event, time: stop.time }).clock : null,
      };

  return {
    directions:
      insideVenue || origin === place
        ? undefined
        : {
            url: directionsUrl({ origin, destination: place, mode: 'transit' }),
            from: previous ? previous.title : hotel?.name,
          },
    food,
    foodSearch: searchUrl(`vegan restaurant near ${place}`),
    shops: (shoppingFor(stop.date)?.picks ?? []).slice(0, 2),
    konbini: searchUrl(`convenience store near ${place}`),
    calendar,
  };
}
