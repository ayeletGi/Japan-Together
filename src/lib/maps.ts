export type TravelMode = 'walking' | 'transit';

interface DirectionsOptions {
  /** Omit to let Google Maps start from the user's current location. */
  origin?: string;
  destination: string;
  mode: TravelMode;
}

/**
 * Builds a Google Maps Directions URL (never a plain place search).
 * Multi-stop transit is not supported by Maps links, so each leg gets its own URL.
 */
export function directionsUrl({ origin, destination, mode }: DirectionsOptions): string {
  const params = new URLSearchParams({ api: '1' });
  if (origin) params.set('origin', origin);
  params.set('destination', destination);
  params.set('travelmode', mode);
  return `https://www.google.com/maps/dir/?${params}`;
}

/** A Google Maps search, for "near here" lookups (vegan food, a konbini) without a fixed place. */
export function searchUrl(query: string): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`;
}
