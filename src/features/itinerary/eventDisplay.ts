import {
  BedDouble,
  Bus,
  Dumbbell,
  Leaf,
  Palette,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
  TrainFront,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react';
import { liveChanges } from '../../data/live';
import { confirmedFor, eventPresentation } from '../../data/presentation';
import type { TripEvent } from '../../data/types';

export type EventCategory =
  | 'flight'
  | 'train'
  | 'transport'
  | 'hotel'
  | 'shabbat'
  | 'food'
  | 'gym'
  | 'ticket'
  | 'shop'
  | 'laundry'
  | 'activity';

/** The original plan has no dedicated kind for gyms, shop stops or laundry; their IDs and source carry it instead. */
export function eventCategory(event: TripEvent): EventCategory {
  if (event.kind === 'food') return 'food';
  // Activities added in the app carry their category as the kind.
  if (event.kind === 'gym' || event.kind === 'shop' || event.kind === 'laundry') return event.kind;
  if (event.id.startsWith('gym')) return 'gym';
  if (event.kind === 'ticket') return 'ticket';
  if (event.id.startsWith('shop')) return 'shop';
  if (event.id.startsWith('laundry')) return 'laundry';
  if (event.kind === 'activity' && event.source === 'shopping-recommendations') return 'shop';
  switch (event.kind) {
    case 'flight':
    case 'train':
    case 'transport':
    case 'hotel':
    case 'shabbat':
      return event.kind;
    default:
      return 'activity';
  }
}

export const categoryIcons: Record<EventCategory, LucideIcon> = {
  flight: Plane,
  train: TrainFront,
  transport: Bus,
  hotel: BedDouble,
  shabbat: Star,
  food: Leaf,
  gym: Dumbbell,
  ticket: Sparkles,
  shop: Palette,
  laundry: WashingMachine,
  activity: ShoppingBag,
};

export const isConfirmed = (event: TripEvent) => event.status === 'confirmed';

/** Translation key under `event.statusLabels`. */
export type StatusKey =
  | 'confirmedBoth'
  | 'confirmedOne'
  | 'confirmed'
  | 'toArrange'
  | 'planned'
  | 'optional'
  | 'todo'
  | 'needsCheck';

export function statusKey(event: TripEvent): StatusKey {
  // A flight, train or entry window that isn't booked yet needs arranging, whatever its source status.
  if (event.priority && event.status !== 'confirmed') return 'toArrange';
  switch (event.status) {
    case 'confirmed': {
      const scope = confirmedFor[event.id];
      if (scope === 'one') return 'confirmedOne';
      if (scope === 'booking') return 'confirmed';
      return 'confirmedBoth';
    }
    case 'todo':
      return 'todo';
    case 'needs-check':
      return 'needsCheck';
    default:
      return pendingStatus(event) === 'optional' ? 'optional' : 'planned';
  }
}

/** Status for anything not yet confirmed (a translation key under `event.status`). */
export function pendingStatus(event: TripEvent): 'optional' | 'planned' {
  return eventCategory(event) === 'gym' ? 'optional' : 'planned';
}

/** Source titles carry the original plan's decoration ("⭐ המלצה שלי:", leading emoji); the card shows it clean. */
export function cleanTitle(title: string): string {
  return title
    .replace(/^[\p{Extended_Pictographic}️\s]+/u, '')
    .replace(/^המלצה שלי:\s*/, '')
    .trim();
}

/** The first part of a note, before the original plan's " | " addenda. */
function noteSummary(note: string): string {
  return note.split(' | ')[0];
}

export interface EventDisplay {
  category: EventCategory;
  title: string;
  description: string;
}

export function eventDisplay(event: TripEvent): EventDisplay {
  const category = eventCategory(event);
  const copy = eventPresentation[event.id];
  const change = liveChanges().events[event.id];
  return {
    category,
    // A renamed activity shows its new name, not the card copy written for the old one.
    title:
      change?.displayTitle ??
      (change?.title ? cleanTitle(change.title) : copy?.title) ??
      cleanTitle(event.title),
    description: change?.displayDescription ?? copy?.description ?? noteSummary(event.note),
  };
}
