import { hotels } from '../../data/hotels';
import { departurePlans, type DeparturePlan } from '../../data/departures';
import { directionsUrl } from '../../lib/maps';

/** Transit route from the plan's hotel, or a walking route from wherever the user is now. */
export function departureMapsUrl(plan: DeparturePlan, fromHotel = true): string {
  return fromHotel
    ? directionsUrl({
        origin: hotels[plan.hotel].mapsQuery,
        destination: plan.destination,
        mode: 'transit',
      })
    : directionsUrl({ destination: plan.destination, mode: 'walking' });
}

/** Departure advice applies only to confirmed bookings. */
export function departureFor(event: { id: string; status: string }): DeparturePlan | undefined {
  if (event.status !== 'confirmed') return undefined;
  return departurePlans.find((plan) => plan.eventId === event.id);
}
