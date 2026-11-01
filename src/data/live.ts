import { useSyncExternalStore } from 'react';
import { entryProblem, LIVE_KINDS, type ListOwner, type LiveKind } from '../../shared/liveSchema';
import { loadJson, removeJson, saveJson } from '../lib/storage';
import type { Expense, Payment } from './budget';
import seed from './live-seed.json';
import type { EventStatus, TripEvent } from './types';

/**
 * Changes made after the original plan, layered on top of the data in code. They live in the
 * Cloudflare D1 database (`worker/`, `migrations/`) so they can be changed during the trip
 * without a new build. This phone keeps the last copy it fetched, so they also work offline;
 * a phone that never connected uses `live-seed.json`, the copy taken at build time.
 */

/** Edits to one activity. A field left out keeps the original value. */
export interface EventChange {
  title?: string;
  time?: string | null;
  end?: string | null;
  place?: string;
  /** Short name for the place in the day's route; defaults to the title. */
  placeLabel?: string;
  note?: string;
  status?: EventStatus;
  /** Card copy that replaces `presentation.ts`. */
  displayTitle?: string;
  displayDescription?: string;
  /** Hide the activity. */
  removed?: boolean;
  /** Why it changed. Not shown in the app. */
  why?: string;
}

export interface DayChange {
  route?: string;
  headline?: string;
  extraTags?: string[];
  why?: string;
}

/** An expense added during the trip, or edits to one in `budget.ts` (same id). */
export type ExpenseChange = Partial<Expense> & { removed?: boolean };

/** A list we added, or changes to one of the lists in code (same id). */
export interface ListChange {
  name?: string;
  /** Lists are shown by this, then by id. */
  order?: number;
  /** Whose list it is; left out, see `buildLists`. */
  owner?: ListOwner;
  removed?: boolean;
}

/** An item added to a list, or changes to one of the built-in checklist's items (same id). */
export interface ListItemChange {
  list?: string;
  text?: string;
  note?: string;
  /** A category key (see `categoryKeys`) or our own words; '' for none. */
  category?: string;
  /** Its photo's id (see `photoUrl`), '' for none. */
  photo?: string;
  /** A web address typed in its own box, '' for none. */
  link?: string;
  /** Ticked in `list`. */
  done?: boolean;
  /** Set on a link (see `linkKey`): item `of` is in `list` too, as the same item. */
  of?: string;
  /** When it was added (ms), to keep the order. */
  at?: number;
  removed?: boolean;
}

/** A settle-up between us, or changes to one (same id). */
export type PaymentChange = Partial<Omit<Payment, 'id'>>;

export interface LiveChanges {
  /** Goes up with every saved change. */
  version: number;
  events: Record<string, EventChange>;
  /** New activities; ids start with `live-`. */
  added: Record<string, TripEvent>;
  days: Record<string, DayChange>;
  expenses: Record<string, ExpenseChange>;
  photoFolders: Record<string, { url: string }>;
  lists: Record<string, ListChange>;
  listItems: Record<string, ListItemChange>;
  payments: Record<string, PaymentChange>;
}

export { LIVE_KINDS, type LiveKind };

const STORAGE_KEY = 'liveChanges';

/** Kinds added later; a copy saved before them (or an older server) simply has none yet. */
const LATER_KINDS: readonly LiveKind[] = ['lists', 'listItems', 'payments'];

/**
 * A set of changes with every kind present, or null when it isn't one. Entries the app could not
 * show (see shared/liveSchema.ts) are left out, so one bad entry never breaks the screens.
 */
function readChanges(value: unknown): LiveChanges | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.version !== 'number') return null;
  const filled: Record<string, unknown> = { version: record.version };
  for (const kind of LIVE_KINDS) {
    const entries = record[kind] ?? (LATER_KINDS.includes(kind) ? {} : undefined);
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) return null;
    filled[kind] = Object.fromEntries(
      Object.entries(entries).filter(([key, data]) => {
        const problem = entryProblem(kind, key, data);
        if (problem) console.warn(`Skipping live change ${kind}/${key}: ${problem}`);
        return !problem;
      }),
    );
  }
  return filled as unknown as LiveChanges;
}

const bundled = readChanges(seed)!;
const saved = readChanges(loadJson<unknown>(STORAGE_KEY));
/** The latest copy from the server (or this phone's saved one). */
let fromServer: LiveChanges = saved && saved.version >= bundled.version ? saved : bundled;
/** What the screens show: the server's copy with our own changes it may not have yet on top. */
let current: LiveChanges = fromServer;
const listeners = new Set<() => void>();

export function liveChanges(): LiveChanges {
  return current;
}

/** Runs after every new set of changes; data modules use it to rebuild before the screen redraws. */
export function onLiveChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Takes a newer set of changes (from the server), keeps it on this phone and redraws. Our own
 * changes it doesn't include yet stay on top, so a copy that left the server just before one of
 * our saves never makes that change vanish and come back.
 */
export function setLiveChanges(value: unknown): boolean {
  const next = readChanges(value);
  if (!next || next.version === fromServer.version) return false;
  fromServer = next;
  saveJson(STORAGE_KEY, next);
  for (const change of pending)
    if (change.savedAs !== undefined && next.version >= change.savedAs) pending.delete(change);
  rebuild();
  return true;
}

/** Forgets this phone's copy (the error screen offers it when a saved copy can't be shown). */
export const forgetSavedChanges = () => removeJson(STORAGE_KEY);

/** Goes up with every change shown on this phone: the server's, and our own before it has them. */
let revision = 0;

function notify() {
  revision += 1;
  for (const listener of [...listeners]) listener();
}

/** One of our changes the server may not have yet; `savedAs` is its version once saved. */
interface Pending {
  kind: LiveKind;
  entries: Record<string, unknown>;
  savedAs?: number;
}

/** Our changes not yet in a copy from the server, oldest first. */
const pending = new Set<Pending>();

/** The server's copy with our pending changes merged in, in the order they were made. */
function rebuild() {
  let next = fromServer;
  for (const { kind, entries } of pending) {
    const table = { ...next[kind] } as Record<string, unknown>;
    for (const [key, data] of Object.entries(entries)) {
      if (data === null) delete table[key];
      else table[key] = { ...(table[key] as object | undefined), ...(data as object) };
    }
    next = { ...next, [kind]: table };
  }
  current = next;
  notify();
}

/**
 * Shows entries on this phone straight away, before the server has them: each one's fields are
 * merged into what is there, and a null entry is removed. They stay on top of every copy from the
 * server until `saved` names the version that has them and a copy that new arrives. `putBack`
 * takes them away again, for when saving fails; a later tap on the same entry keeps its change.
 */
export function showLocally<K extends LiveKind>(
  kind: K,
  entries: Record<string, Partial<LiveChanges[K][string]> | null>,
): { saved: (version: number) => void; putBack: () => void } {
  const change: Pending = { kind, entries };
  pending.add(change);
  rebuild();
  return {
    saved: (version) => {
      change.savedAs = version;
      if (fromServer.version >= version && pending.delete(change)) rebuild();
    },
    putBack: () => {
      if (pending.delete(change)) rebuild();
    },
  };
}

const getRevision = () => revision;
const getChanges = () => current;

/** The current changes; redraws the calling component whenever they change, even locally. */
export function useLiveChanges(): LiveChanges {
  return useSyncExternalStore(onLiveChange, getChanges, getChanges);
}

/**
 * Redraws the calling component whenever the changes do, even locally: a change saved on this
 * phone shows at once, though the server's `version` only moves once it has it.
 */
export function useLiveVersion(): number {
  return useSyncExternalStore(onLiveChange, getRevision, getRevision);
}
