import { useCallback, useSyncExternalStore } from 'react';
import { loadJson, removeJson, saveJson } from '../lib/storage';

/** Values already read or written in this visit, so every screen using a key sees the same one. */
const memory = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();
const unsaved = new Set<string>();

function read<T>(key: string, fallback: T): T {
  if (memory.has(key)) return memory.get(key) as T;
  const value = loadJson<T>(key) ?? fallback;
  memory.set(key, value);
  return value;
}

/** Stores a value (or, with `remove`, forgets the saved one) and tells every reader. */
function write(key: string, value: unknown, remove = false) {
  memory.set(key, value);
  const stored = remove ? removeJson(key) : saveJson(key, value);
  if (stored) unsaved.delete(key);
  else unsaved.add(key);
  listeners.get(key)?.forEach((notify) => notify());
}

function subscribe(key: string, notify: () => void) {
  const set = listeners.get(key) ?? new Set();
  set.add(notify);
  listeners.set(key, set);
  return () => set.delete(notify);
}

/**
 * State saved in this browser only (localStorage). It never syncs between phones; screens that use
 * it say so. Every component using the same key shares one value. Storage can be unavailable
 * (private mode), in which case the state lasts for the visit and `saved` is false.
 * `fallback` should be a module-level constant: a new object each render would re-create the setters.
 */
export function useLocalState<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    useCallback((notify: () => void) => subscribe(key, notify), [key]),
    () => read(key, fallback),
    () => fallback,
  );

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = read(key, fallback);
      write(key, typeof next === 'function' ? (next as (current: T) => T)(current) : next);
    },
    [key, fallback],
  );

  const clear = useCallback(() => write(key, fallback, true), [key, fallback]);

  return [value, setValue, { saved: !unsaved.has(key), clear }] as const;
}
