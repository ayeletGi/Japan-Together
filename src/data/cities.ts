import type { Tone } from '../components/tone';

/** Where the trip is on a given day; `flight` covers the two travel days. */
export type CityId = 'tokyo' | 'kobe' | 'osaka' | 'kyoto' | 'disney' | 'flight';

/** One colour family per city, for the schedule ribbons and the hotel dots. */
export const cityTone: Record<CityId, Tone> = {
  tokyo: 'pink',
  kobe: 'mint',
  osaka: 'lav',
  kyoto: 'sun',
  disney: 'sky',
  flight: 'gray',
};
