/**
 * The Worker: serves the web build (dist-web) and a small API for the changes made after
 * the original plan, stored in D1 (see migrations/ and src/data/live.ts).
 *
 * GET  /api/changes?since=N   everything, or `{ version, unchanged: true }` when N is current. Open.
 * POST /api/change            `{ kind, key, data | null, merge?, why? }` saves or deletes one entry,
 *                             or `{ changes: [{ kind, key, data, merge? }], why? }` several at once.
 *                             With `merge`, `data` holds only the fields to change.
 * POST /api/undo              reverts the latest change that wasn't undone yet (all of it, when
 *                             several entries were saved at once). `{ kind, key? }` limits it to
 *                             changes of that kind (and entry).
 * GET  /api/history?limit=N   the latest changes.
 * GET  /api/me                whose code this is: `{ who }`.
 * POST /api/photo             a list item's photo (JPEG, PNG or WebP bytes): `{ id }`.
 * GET  /api/photo/<id>        that photo. Open, and kept by phones for good: a photo never changes.
 * Writes and history need `Authorization: Bearer <code>`; each person has their own code (secrets
 * PIN_DANA, PIN_NOA, PIN_CLAUDE). After too many wrong codes from one address, that address is
 * refused for an hour; a right code clears its count.
 */
import {
  entryProblem,
  isLiveKind,
  KEY_PATTERN,
  LIVE_KINDS,
  LIVE_TABLES,
  MAX_DATA_CHARS,
  MAX_ENTRIES,
  type LiveKind,
} from '../shared/liveSchema';
import { LOCK_MS, MAX_FAILURES, MAX_PHOTO_BYTES } from './limits';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  PIN_DANA?: string;
  PIN_NOA?: string;
  PIN_CLAUDE?: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...CORS,
    },
  });
}

async function version(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT value FROM meta WHERE key = 'version'")
    .first<{ value: string }>();
  return Number(row?.value ?? 0);
}

/** A stored JSON object, or null when the row can't be read (it is then left out, not fatal). */
function parseObject(text: string | null): Record<string, unknown> | null {
  if (text === null) return null;
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function allChanges(db: D1Database) {
  const results = await db.batch([
    db.prepare("SELECT value FROM meta WHERE key = 'version'"),
    ...LIVE_KINDS.map((kind) => db.prepare(`SELECT key, data FROM ${LIVE_TABLES[kind]}`)),
  ]);
  const body: Record<string, unknown> = {
    version: Number((results[0].results[0] as { value: string } | undefined)?.value ?? 0),
  };
  LIVE_KINDS.forEach((kind, index) => {
    const rows = results[index + 1].results as { key: string; data: string }[];
    const entries: Record<string, unknown> = {};
    for (const row of rows) {
      const data = parseObject(row.data);
      if (data) entries[row.key] = data;
    }
    body[kind] = entries;
  });
  return body;
}

async function sha256(text: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
}

/** Who the code belongs to, or a response that refuses the request. */
async function authorize(request: Request, env: Env): Promise<string | Response> {
  const address = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const now = Date.now();
  const failures = await env.DB.prepare('SELECT count, since FROM failures WHERE address = ?1')
    .bind(address)
    .first<{ count: number; since: number }>();
  if (failures && now - failures.since < LOCK_MS && failures.count >= MAX_FAILURES) {
    return json({ error: 'locked' }, 429);
  }

  const given = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const people: [string, string | undefined][] = [
    ['dana', env.PIN_DANA],
    ['noa', env.PIN_NOA],
    ['claude', env.PIN_CLAUDE],
  ];
  if (given) {
    const givenHash = await sha256(given);
    for (const [who, pin] of people) {
      if (pin && crypto.subtle.timingSafeEqual(givenHash, await sha256(pin))) {
        if (failures) {
          await env.DB.prepare('DELETE FROM failures WHERE address = ?1').bind(address).run();
        }
        return who;
      }
    }
  }
  // One statement, so two wrong tries at the same moment both count. A count older than the lock
  // starts again from one.
  await env.DB.prepare(
    `INSERT INTO failures (address, count, since) VALUES (?1, 1, ?2)
     ON CONFLICT(address) DO UPDATE SET
       count = CASE WHEN ?2 - since >= ?3 THEN 1 ELSE count + 1 END,
       since = CASE WHEN ?2 - since >= ?3 THEN ?2 ELSE since END`,
  )
    .bind(address, now, LOCK_MS)
    .run();
  return json({ error: 'wrong code' }, 401);
}

/** One entry as asked for: `data` is the new object (or only its changed fields with `merge`). */
interface Entry {
  kind: LiveKind;
  key: string;
  data: Record<string, unknown> | null;
  merge: boolean;
}

/** One entry as it will be stored, with the JSON it replaces. */
interface Write {
  kind: LiveKind;
  key: string;
  before: string | null;
  after: string | null;
}

async function stored(db: D1Database, kind: LiveKind, key: string): Promise<string | null> {
  const row = await db
    .prepare(`SELECT data FROM ${LIVE_TABLES[kind]} WHERE key = ?1`)
    .bind(key)
    .first<{ data: string }>();
  return row?.data ?? null;
}

/**
 * Stores the entries, logs each one and bumps the version, all in one transaction. Entries saved
 * together share a batch id, so one undo reverts them together. `undoes` marks those history rows
 * (and this save itself) as undone, in the same transaction.
 */
async function commit(
  db: D1Database,
  who: string,
  writes: Write[],
  why: string | null,
  undoes: number[] = [],
): Promise<number> {
  const at = new Date().toISOString();
  const batch = crypto.randomUUID();
  const statements = writes.flatMap(({ kind, key, before, after }) => [
    after === null
      ? db.prepare(`DELETE FROM ${LIVE_TABLES[kind]} WHERE key = ?1`).bind(key)
      : db
          .prepare(
            `INSERT INTO ${LIVE_TABLES[kind]} (key, data, updated_at, updated_by) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(key) DO UPDATE SET data = ?2, updated_at = ?3, updated_by = ?4`,
          )
          .bind(key, after, at, who),
    db
      .prepare(
        `INSERT INTO history (at, who, kind, key, before, after, why, batch, undone)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      )
      .bind(at, who, kind, key, before, after, why, batch, undoes.length ? 1 : 0),
  ]);
  statements.push(
    ...undoes.map((id) => db.prepare('UPDATE history SET undone = 1 WHERE id = ?1').bind(id)),
    db.prepare(
      "UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'version' RETURNING value",
    ),
  );
  const results = await db.batch(statements);
  return Number((results.at(-1)!.results[0] as { value: string | number }).value);
}

/** One `{ kind, key, data, merge? }`, checked; a string says what is wrong with it. */
function readEntry(value: unknown): Entry | string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'expected { kind, key, data }';
  }
  const { kind, key, data, merge } = value as Record<string, unknown>;
  if (!isLiveKind(kind) || typeof key !== 'string' || !KEY_PATTERN.test(key)) {
    return 'expected { kind, key, data }';
  }
  if (data !== null && (typeof data !== 'object' || Array.isArray(data))) {
    return 'data must be an object or null';
  }
  if (merge !== undefined && typeof merge !== 'boolean') return 'merge must be true or false';
  if (merge && data === null) return 'nothing to merge';
  return { kind, key, data: data as Record<string, unknown> | null, merge: !!merge };
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** What the entries will store, or a response that refuses them. */
async function prepareWrites(db: D1Database, entries: Entry[]): Promise<Write[] | Response> {
  const writes: Write[] = [];
  for (const { kind, key, data, merge } of entries) {
    const before = await stored(db, kind, key);
    const next = data && merge ? { ...parseObject(before), ...data } : data;
    if (next) {
      const problem = entryProblem(kind, key, next);
      if (problem) return json({ error: `${kind}/${key}: ${problem}` }, 400);
    }
    const after = next && JSON.stringify(next);
    if (after && after.length > MAX_DATA_CHARS) return json({ error: 'too long' }, 413);
    writes.push({ kind, key, before, after });
  }
  return writes;
}

async function handleChange(request: Request, env: Env, who: string): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ error: 'expected { kind, key, data }' }, 400);
  const raw: unknown[] = Array.isArray(body.changes) ? body.changes : [body];
  if (!raw.length) return json({ error: 'no changes' }, 400);
  if (raw.length > MAX_ENTRIES) return json({ error: 'too many changes' }, 400);
  const entries: Entry[] = [];
  for (const item of raw) {
    const entry = readEntry(item);
    if (typeof entry === 'string') return json({ error: entry }, 400);
    if (entries.some((other) => other.kind === entry.kind && other.key === entry.key)) {
      return json({ error: 'the same entry twice' }, 400);
    }
    entries.push(entry);
  }
  const writes = await prepareWrites(env.DB, entries);
  if (writes instanceof Response) return writes;
  const why = typeof body.why === 'string' ? body.why.slice(0, 500) : null;
  return json({ version: await commit(env.DB, who, writes, why) });
}

async function handleUndo(request: Request, env: Env, who: string): Promise<Response> {
  const body = (await readBody(request)) ?? {};
  const kind = isLiveKind(body.kind) ? body.kind : null;
  const key = kind && typeof body.key === 'string' ? body.key : null;
  const filter = kind ? (key ? ' AND kind = ?1 AND key = ?2' : ' AND kind = ?1') : '';
  const last = await env.DB.prepare(
    `SELECT id, batch FROM history WHERE undone = 0${filter} ORDER BY id DESC LIMIT 1`,
  )
    .bind(...[kind, key].filter((value) => value !== null))
    .first<{ id: number; batch: string | null }>();
  if (!last) return json({ error: 'nothing to undo' }, 404);
  // Older rows have no batch; they are undone one at a time.
  const rows = (
    await env.DB.prepare(
      'SELECT id, kind, key, before FROM history WHERE undone = 0 AND (id = ?1 OR batch = ?2) ORDER BY id DESC',
    )
      .bind(last.id, last.batch)
      .all<{ id: number; kind: string; key: string; before: string | null }>()
  ).results;
  const writes: Write[] = [];
  for (const row of rows) {
    if (!isLiveKind(row.kind)) continue;
    // The same entry twice in one batch only happens with old rows; the oldest value wins.
    const seen = writes.find((write) => write.kind === row.kind && write.key === row.key);
    if (seen) seen.after = row.before;
    else
      writes.push({
        kind: row.kind,
        key: row.key,
        before: await stored(env.DB, row.kind, row.key),
        after: row.before,
      });
  }
  if (!writes.length) return json({ error: 'nothing to undo' }, 404);
  const ids = rows.map((row) => row.id);
  // The undo itself is history too, but it is not undone by the next undo.
  const next = await commit(env.DB, who, writes, `undo #${ids.join(', #')}`, ids);
  return json({ version: next, undid: rows });
}

/** The photo types we keep, by their first bytes, so nothing else is ever served as a photo. */
const PHOTO_TYPES: [string, number[]][] = [
  ['image/jpeg', [0xff, 0xd8, 0xff]],
  ['image/png', [0x89, 0x50, 0x4e, 0x47]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]],
];
const PHOTO_PATH = /^\/api\/photo\/([\w-]{1,80})$/;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const fromBase64 = (text: string) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

async function handlePhotoUpload(request: Request, env: Env, who: string): Promise<Response> {
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) return json({ error: 'no photo' }, 400);
  if (bytes.length > MAX_PHOTO_BYTES) return json({ error: 'too big' }, 413);
  const type = PHOTO_TYPES.find(([, start]) => start.every((byte, i) => bytes[i] === byte))?.[0];
  if (!type) return json({ error: 'not a photo' }, 415);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO photos (id, type, data, added_at, added_by) VALUES (?1, ?2, ?3, ?4, ?5)',
  )
    .bind(id, type, toBase64(bytes), new Date().toISOString(), who)
    .run();
  return json({ id });
}

async function servePhoto(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT type, data FROM photos WHERE id = ?1')
    .bind(id)
    .first<{ type: string; data: string }>();
  if (!row) return json({ error: 'not found' }, 404);
  return new Response(fromBase64(row.data), {
    headers: {
      'Content-Type': row.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
      ...CORS,
    },
  });
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const { pathname } = url;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  if (pathname === '/api/changes' && request.method === 'GET') {
    const current = await version(env.DB);
    if (url.searchParams.get('since') === String(current)) {
      return json({ version: current, unchanged: true });
    }
    return json(await allChanges(env.DB));
  }

  const photo = PHOTO_PATH.exec(pathname);
  if (photo && request.method === 'GET') return servePhoto(env, photo[1]);

  const routes: Record<string, (who: string) => Promise<Response>> = {
    'POST /api/photo': (who) => handlePhotoUpload(request, env, who),
    'POST /api/change': (who) => handleChange(request, env, who),
    'POST /api/undo': (who) => handleUndo(request, env, who),
    'GET /api/me': async (who) => json({ who }),
    'GET /api/history': async () => {
      const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 200);
      const rows = await env.DB.prepare('SELECT * FROM history ORDER BY id DESC LIMIT ?1')
        .bind(limit)
        .all();
      return json(rows.results);
    },
  };
  const route = routes[`${request.method} ${pathname}`];
  if (!route) return json({ error: 'not found' }, 404);
  const who = await authorize(request, env);
  return who instanceof Response ? who : route(who);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (error) {
        console.error(error);
        return json({ error: 'server error' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
