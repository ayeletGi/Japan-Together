import type { Journey } from './types';

/** Flights and booked trains, restructured from the confirmed source notes. */
const journeys: Journey[] = [
  {
    eventId: 'd2-01',
    number: 'LY91',
    depart: { date: '2037-11-02', clock: '19:00', zone: 'Asia/Jerusalem', place: 'נתב״ג T3' },
    arrive: { date: '2037-11-03', clock: '13:25', zone: 'Asia/Tokyo', place: 'נריטה T1' },
  },
  {
    eventId: 'd5-03',
    number: 'NOZOMI 53',
    depart: { date: '2037-11-05', clock: '17:19', zone: 'Asia/Tokyo', place: 'Shinagawa' },
    arrive: { date: '2037-11-05', clock: '19:53', zone: 'Asia/Tokyo', place: 'Shin-Kobe' },
    seats: 'קרון 14 · מושבים 10D, 10E',
  },
  {
    eventId: 'd11-04',
    number: 'NOZOMI 46',
    depart: { date: '2037-11-11', clock: '18:30', zone: 'Asia/Tokyo', place: 'Shin-Osaka' },
    arrive: { date: '2037-11-11', clock: '20:49', zone: 'Asia/Tokyo', place: 'Shinagawa' },
    seats: 'קרון 14 · מושבים 8D, 8E',
  },
  {
    eventId: 'd18-03',
    number: 'LY92',
    depart: { date: '2037-11-18', clock: '15:45', zone: 'Asia/Tokyo', place: 'נריטה T1' },
    arrive: { date: '2037-11-18', clock: '22:05', zone: 'Asia/Jerusalem', place: 'נתב״ג T3' },
  },
];

export function journeyFor(eventId: string): Journey | undefined {
  return journeys.find((journey) => journey.eventId === eventId);
}

/** The flights there and back. */
export const outbound = journeyFor('d2-01')!;
export const homebound = journeyFor('d18-03')!;
