import { MAX_ENTRIES } from '../../shared/liveSchema';
import { showLocally, type EventChange, type LiveChanges, type LiveKind } from '../data/live';
import type { TripEvent } from '../data/types';
import type { PlanStop } from '../features/itinerary/stops';
import { formatClock, toMinutes } from './time';
import { LIVE_API, refreshLiveChanges } from './liveSync';
import { loadJson, removeJson, saveJson } from './storage';

/**
 * Editing the live changes from the app. Reading stays open; saving needs a personal code, typed
 * once per phone and kept here. The server checks it (`worker/index.ts`) and refuses a phone for
 * an hour after too many wrong codes.
 */

const CODE_KEY = 'liveCode';
const WHO_KEY = 'liveWho';
const TIMEOUT_MS = 15 * 1000;

export const savedCode = (): string | undefined => loadJson<string>(CODE_KEY);
export const forgetCode = (): void => {
  removeJson(CODE_KEY);
  removeJson(WHO_KEY);
};

/** Whose code this phone has ('dana', 'noa' or 'claude'), once the server said so. */
export const savedWho = (): string | undefined => loadJson<string>(WHO_KEY);

/** Why a request to the server failed. */
export type LiveError = 'wrong' | 'locked' | 'offline' | 'nothing' | 'failed';

export class LiveEditError extends Error {
  constructor(readonly reason: LiveError) {
    super(reason);
  }
}

/** The reason to show for any failure (a translation key under `live.errors`). */
export const errorReason = (failure: unknown): LiveError =>
  failure instanceof LiveEditError ? failure.reason : 'failed';

async function call(path: string, code: string, init: RequestInit = {}): Promise<unknown> {
  if (!navigator.onLine) throw new LiveEditError('offline');
  let response: Response;
  try {
    response = await fetch(`${LIVE_API}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${code}`,
        // A photo's Blob brings its own type.
        ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new LiveEditError('offline');
  }
  if (response.status === 401) throw new LiveEditError('wrong');
  if (response.status === 429) throw new LiveEditError('locked');
  if (response.status === 404 && path === '/undo') throw new LiveEditError('nothing');
  if (!response.ok) throw new LiveEditError('failed');
  try {
    return await response.json();
  } catch {
    throw new LiveEditError('failed');
  }
}

/** Checks a code with the server and keeps it, and whose it is, on this phone when it is right. */
export async function unlock(code: string): Promise<void> {
  const clean = code.trim();
  const { who } = (await call('/me', clean)) as { who: string };
  saveJson(CODE_KEY, clean);
  saveJson(WHO_KEY, who);
}

function needCode(): string {
  const code = savedCode();
  if (!code) throw new LiveEditError('wrong');
  return code;
}

/** A wrong code means the saved one was changed on the server; forget it so the phone asks again. */
async function withCode<T>(run: (code: string) => Promise<T>): Promise<T> {
  try {
    return await run(needCode());
  } catch (error) {
    if (errorReason(error) === 'wrong') forgetCode();
    throw error;
  }
}

/** Saves one at a time, in the order they were asked for, so two quick taps arrive in order. */
let queue: Promise<unknown> = Promise.resolve();
function inOrder<T>(run: () => Promise<T>): Promise<T> {
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

/** Entries to save of one kind; each holds only the fields to change, and null removes it. */
type Entries<K extends LiveKind> = Record<string, Partial<LiveChanges[K][string]> | null>;

/**
 * Saves entries for everyone in one go, of one kind or several (one undo reverts them all, and
 * the server keeps all or none). Each entry holds only the fields to change; the server merges
 * them into what it has, so two phones changing different fields of the same entry both keep
 * their change. A null entry is removed. They show on this phone at once and go back if saving
 * fails; then this phone refreshes.
 */
export async function saveTogether(groups: { [K in LiveKind]?: Entries<K> }): Promise<void> {
  const kinds = (Object.keys(groups) as LiveKind[]).filter(
    (kind) => Object.keys(groups[kind] ?? {}).length,
  );
  const changes = kinds.flatMap((kind) =>
    Object.entries(groups[kind] ?? {}).map(([key, data]) => ({
      kind,
      key,
      data,
      merge: data !== null,
    })),
  );
  if (!changes.length) return;
  if (changes.length > MAX_ENTRIES) throw new LiveEditError('failed');
  if (!savedCode()) throw new LiveEditError('wrong');
  if (!navigator.onLine) throw new LiveEditError('offline');
  const shown = kinds.map((kind) => showLocally(kind, groups[kind] as Entries<typeof kind>));
  try {
    const { version } = (await inOrder(() =>
      withCode((code) =>
        call('/change', code, { method: 'POST', body: JSON.stringify({ changes }) }),
      ),
    )) as { version: number };
    for (const each of shown) each.saved(version);
  } catch (error) {
    for (const each of shown) each.putBack();
    throw error;
  }
  await refreshLiveChanges();
}

/** Saves entries of one kind for everyone (see `saveTogether`). */
export const saveEntries = <K extends LiveKind>(kind: K, entries: Entries<K>): Promise<void> =>
  saveTogether({ [kind]: entries });

/** Saves activities' changes (only the fields that change); a null change clears it. */
export const saveEventChanges = (changes: Record<string, EventChange | null>) =>
  saveEntries('events', changes);

export const saveEventChange = (id: string, change: EventChange | null) =>
  saveEventChanges({ [id]: change });

/** Saves list entries for everyone (only the fields that change; a null entry is removed). */
export const saveListEntries = <K extends 'lists' | 'listItems'>(
  kind: K,
  entries: Record<string, Partial<LiveChanges[K][string]> | null>,
) => saveEntries(kind, entries);

/** Where a list item's photo is; phones keep it once seen (the service worker, build-web.mjs). */
export const photoUrl = (id: string) => `${LIVE_API}/photo/${id}`;

/** Saves a photo (shrunk first, see `shrinkPhoto`) and gives its id, for an item's `photo`. */
export async function uploadPhoto(photo: Blob): Promise<string> {
  if (!savedCode()) throw new LiveEditError('wrong');
  const { id } = (await inOrder(() =>
    withCode((code) => call('/photo', code, { method: 'POST', body: photo })),
  )) as { id: string };
  return id;
}

/** Adds a new activity to a day for both of us. */
export const saveAddedEvent = (event: TripEvent) => saveEntries('added', { [event.id]: event });

/**
 * Reverts the latest change, then refreshes this phone. With a scope, only the latest change of
 * that kind (and entry): undo inside a stop's editor never takes back a tick on a list.
 */
export async function undoLastChange(scope?: { kind: LiveKind; key?: string }): Promise<void> {
  await inOrder(() =>
    withCode((code) => call('/undo', code, { method: 'POST', body: JSON.stringify(scope ?? {}) })),
  );
  await refreshLiveChanges();
}

const DAY_END = 23 * 60 + 59;

/** A stop that moving can take part in: one of the plan's activities that isn't pinned (📌). */
const movable = (stop: PlanStop) => !!stop.event && !stop.pinned;

/** How long a stop lasts, when it has an end after its start. */
function length(stop: PlanStop): number | null {
  const end = stop.event?.end;
  if (!end) return null;
  const minutes = toMinutes(end) - stop.minutes;
  return minutes > 0 ? minutes : null;
}

/**
 * Moving a stop up (-1) or down (+1): it trades places with the nearest movable stop that way,
 * jumping over pinned ones. The later one takes the earlier start; the earlier one starts where
 * the later one did, or once it ends if it runs longer, so the two never overlap. Each keeps its
 * length. Only the times change (the server merges them in); null at either end.
 */
export function swapTimes(
  stops: PlanStop[],
  id: string,
  direction: -1 | 1,
): Record<string, EventChange> | null {
  const index = stops.findIndex((stop) => stop.id === id);
  const stop = stops[index];
  if (!stop || !movable(stop)) return null;
  let other = index + direction;
  while (stops[other] && !movable(stops[other])) other += direction;
  const target = stops[other];
  if (!target) return null;
  const [first, second] = direction > 0 ? [stop, target] : [target, stop];
  const secondStart = first.minutes;
  const firstStart = Math.max(second.minutes, secondStart + (length(second) ?? 0));
  const at = (from: PlanStop, minutes: number): EventChange => {
    const start = Math.min(DAY_END, minutes);
    const span = length(from);
    return {
      time: formatClock(start),
      ...(span ? { end: formatClock(Math.min(DAY_END, start + span)) } : {}),
    };
  };
  return {
    [second.event!.id]: at(second, secondStart),
    [first.event!.id]: at(first, firstStart),
  };
}

/** Whose code this phone has; asks the server once for a code saved before it said. */
export async function whoAmI(): Promise<string | undefined> {
  const known = savedWho();
  const code = savedCode();
  if (known || !code) return known;
  try {
    const { who } = (await call('/me', code)) as { who: string };
    saveJson(WHO_KEY, who);
    return who;
  } catch {
    return undefined;
  }
}

/** What the edit sheet shows and changes. */
export interface EventForm {
  title: string;
  time: string;
  end: string;
  place: string;
  note: string;
  displayTitle: string;
  displayDescription: string;
}

export function eventForm(
  event: TripEvent,
  display: { title: string; description: string },
): EventForm {
  return {
    title: event.title,
    time: event.time ?? '',
    end: event.end ?? '',
    place: event.place,
    note: event.note,
    displayTitle: display.title,
    displayDescription: display.description,
  };
}

/**
 * The fields that now differ from what was shown, as a change to merge in; null when nothing
 * changed. Empty times mean "no fixed time".
 */
export function mergeEventChange(before: EventForm, after: EventForm): EventChange | null {
  const next: EventChange = {};
  for (const field of ['title', 'place', 'note', 'displayTitle', 'displayDescription'] as const) {
    const value = after[field].trim();
    if (value !== before[field].trim()) next[field] = value;
  }
  for (const field of ['time', 'end'] as const) {
    if (after[field] !== before[field]) next[field] = after[field] || null;
  }
  return Object.keys(next).length ? next : null;
}
