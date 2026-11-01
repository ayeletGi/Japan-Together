/** Geometry of the stamp-rally map: a 340×120 drawing, the hotel at one end, stops zig-zagging. */
export const MAP_WIDTH = 340;
export const MAP_HEIGHT = 120;

export type Point = readonly [number, number];

/**
 * The hotel first, then one point per stop, alternating high and low across the map. The route
 * reads in the page direction: right to left in Hebrew, left to right in English.
 */
export function stopPoints(count: number, rtl: boolean): Point[] {
  const span = 296;
  const points: Point[] = [[322, 92]];
  for (let i = 0; i < count; i++) points.push([322 - (i + 1) * (span / count), i % 2 ? 74 : 44]);
  return rtl ? points : points.map(([x, y]) => [MAP_WIDTH - x, y] as const);
}

/**
 * Where the cat stands: on the next stop to visit (the first one before any stamp), one stop on
 * per stamp, and at the last stop once the day is complete. 0 is the hotel, which it never needs.
 */
export function catStop(count: number, reached: number): number {
  return Math.min(reached + 1, count);
}

/** The same walk as a share of the route: 0 at the first stop, 1 at the last (or a done day). */
export function catShare(count: number, reached: number): number {
  if (reached >= count) return 1;
  return count > 1 ? (catStop(count, reached) - 1) / (count - 1) : 0;
}

/** A smooth curve through the points (horizontal tangents at each one). */
export function routePath(points: readonly Point[]): string {
  if (!points.length) return '';
  let path = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const mid = (ax + bx) / 2;
    path += ` C${mid} ${ay} ${mid} ${by} ${bx} ${by}`;
  }
  return path;
}
