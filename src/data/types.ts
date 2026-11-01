import type { TravelMode } from '../lib/maps';
import type { TimeZone } from '../lib/time';
import type { CityId } from './cities';
import type { HotelId } from './hotels';

export type EventStatus = 'confirmed' | 'planned' | 'todo' | 'needs-check';

/** One activity, exactly as it appears in the original source (minus private document refs). */
export interface TripEvent {
  id: string;
  title: string;
  /** Local time HH:MM (Japan unless `eventTimeZone` says otherwise). `null` = no fixed time. */
  time: string | null;
  end: string | null;
  date: string;
  city: string;
  status: EventStatus;
  kind: string;
  place: string;
  note: string;
  source: string;
  priority: boolean;
  special: string | null;
  /** Extra source fields that some events carry. */
  hotelSchedule?: { checkin: string; checkout: string; url: string; action: string };
  timeGcal?: string | null;
  endGcal?: string | null;
  calendarDisabled?: boolean;
}

export interface TripDay {
  date: string;
  city: string;
  title: string;
  subtitle: string;
  route: string;
  headline: string;
  tags: string[];
  events: TripEvent[];
}

/** Friendly display copy layered on top of a source event. */
export interface EventPresentation {
  title: string;
  description: string;
}

export interface Hotel {
  id: string;
  name: string;
  /** Query that Google Maps resolves to the right building. */
  mapsQuery: string;
  shortName: string;
  /** The hotel's name in Japanese, shown large on the taxi card. */
  jpName: string;
  city: string;
  /** City colour family for ribbons and dots. */
  area: CityId;
  checkIn: string;
  checkOut: string;
  /** Hotel hours as recorded in the original plan (from the booking or the official site). */
  checkInFrom: string;
  checkOutBy: string;
  website: string;
  notes?: string[];
  /** Nice extras (spa, lounge, aquarium…), from the hotel sites as of Oct 2026. */
  facilities?: string[];
}

/** A booked journey (flight or train) with its own departure and arrival clocks. */
export interface Journey {
  eventId: string;
  number: string;
  depart: { date: string; clock: string; zone: TimeZone; place: string };
  arrive: { date: string; clock: string; zone: TimeZone; place: string };
  seats?: string;
}

export interface RouteStop {
  label: string;
  /** Google Maps query for the place. */
  query: string;
}

export interface RouteSegment {
  id: string;
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  mode: TravelMode;
  /** The event this leg arrives at. */
  eventId?: string;
  /** The leg is a booked train: Maps shows the line, the ticket is already confirmed. */
  bookedTrain?: boolean;
  /** The hotel shuttle runs this leg; Maps can only show a public-transport alternative. */
  shuttle?: boolean;
  /** Shabbat: walking only. */
  shabbat?: boolean;
}

export interface DayRoute {
  date: string;
  start: RouteStop;
  segments: RouteSegment[];
  /** Days without ground legs (the outbound flight). */
  note?: string;
}

export interface ExternalResource {
  label: string;
  url: string;
}

/** Where a place added after the original plan was checked, and how trustworthy that source is. */
export interface SourceCheck {
  /** ISO date of the check. */
  date: string;
  /** Short source name, e.g. "HappyCow". Left out for the place's own official site. */
  source?: string;
  link: string;
  /** True when the details come from the place's own site. */
  official: boolean;
}

/** A curated link in the "more places" list at the bottom of a Discover tab. */
export interface MoreLink {
  label: string;
  note: string;
  url: string;
}

export type { HotelId };

/** Text written in both app languages. */
export interface Bilingual {
  he: string;
  en: string;
}
