import { hotelAt, type TripHotel } from '../../data/hotels';
import type { Hotel, TripEvent } from '../../data/types';
import { addDays } from '../../lib/time';

/** Check-in, check-out and luggage stops belong to a hotel; other stops do not. */
export function hotelOfEvent(event: TripEvent | undefined): TripHotel | undefined {
  if (!event) return undefined;
  const isHotelStop = event.kind === 'hotel' || /מזוודות|luggage/i.test(event.title);
  return isHotelStop ? hotelAt(event.place) : undefined;
}

/** The dates we sleep at the hotel: check-in day up to the night before check-out. */
export function nightDates(hotel: Hotel): string[] {
  const dates: string[] = [];
  for (let date = hotel.checkIn; date < hotel.checkOut; date = addDays(date, 1)) dates.push(date);
  return dates;
}
