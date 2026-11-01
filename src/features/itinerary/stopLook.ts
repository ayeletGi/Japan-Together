import type { LucideIcon } from 'lucide-react';
import type { Tone } from '../../components/tone';
import { attractionIcon } from './attractionIcons';
import { categoryIcons, type EventCategory } from './eventDisplay';
import type { PlanStop } from './stops';

/** The pastel tone of each kind of stop, for its icon tile. */
const categoryTone: Record<EventCategory, Tone> = {
  flight: 'sky',
  train: 'mint',
  transport: 'mint',
  hotel: 'lav',
  shabbat: 'lav',
  food: 'sun',
  gym: 'mint',
  ticket: 'pink',
  shop: 'lav',
  laundry: 'sky',
  activity: 'pink',
};

export const stopTone = (stop: Pick<PlanStop, 'category'>): Tone => categoryTone[stop.category];

/** A drawing of the thing itself when the plan knows it (a bowl for ramen), else its category. */
export const stopIcon = (stop: PlanStop): LucideIcon =>
  stop.event ? attractionIcon(stop.event) : categoryIcons[stop.category];
