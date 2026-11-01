// Kept apart from index.ts: the Workers runtime only accepts handlers as the main module's exports.

/** Wrong codes one address may send before it is refused. */
export const MAX_FAILURES = 10;
/** How long that lasts. */
export const LOCK_MS = 60 * 60 * 1000;
/** The largest photo the Worker keeps; the app shrinks photos well below this first. */
export const MAX_PHOTO_BYTES = 600 * 1024;
