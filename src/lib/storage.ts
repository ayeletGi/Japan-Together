/**
 * JSON values kept in this browser's localStorage under one app prefix. Storage can be blocked
 * (private mode) or hold an unreadable value; every helper then fails quietly and the caller falls
 * back to its default.
 */
export const PREFIX = 'japan-together.';

/** The saved value, or undefined when there is none or it can't be read. */
export function loadJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

/** Saves a value; false when storage is unavailable. */
export function saveJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Forgets a saved value; false when storage is unavailable. */
export function removeJson(key: string): boolean {
  try {
    localStorage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}
