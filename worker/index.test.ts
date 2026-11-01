// @vitest-environment node
/**
 * The Worker against a real SQLite database with every migration applied (node:sqlite stands in
 * for D1: same SQL, `?1` parameters, and `batch` as one transaction).
 */
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import worker, { type Env } from './index';
import { MAX_FAILURES, MAX_PHOTO_BYTES } from './limits';

type Row = Record<string, unknown>;

class Statement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: (string | number | null)[] = [],
  ) {}
  bind(...params: (string | number | null)[]) {
    return new Statement(this.db, this.sql, params);
  }
  rows(): Row[] {
    const statement = this.db.prepare(this.sql);
    if (/^\s*SELECT|RETURNING/i.test(this.sql)) return statement.all(...this.params) as Row[];
    statement.run(...this.params);
    return [];
  }
  async first<T>() {
    return (this.rows()[0] ?? null) as T | null;
  }
  async all<T>() {
    return { results: this.rows() as T[] };
  }
  async run() {
    return { results: this.rows() };
  }
}

function fakeD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync('migrations').sort()) {
    db.exec(fs.readFileSync(`migrations/${file}`, 'utf8'));
  }
  return {
    prepare: (sql: string) => new Statement(db, sql),
    batch: async (statements: Statement[]) => {
      db.exec('BEGIN');
      try {
        const results = statements.map((statement) => ({ results: statement.rows() }));
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as D1Database;
}

// Cloudflare's own addition to Web Crypto.
const subtle = crypto.subtle as SubtleCrypto & { timingSafeEqual?: unknown };
subtle.timingSafeEqual ??= (a: ArrayBuffer, b: ArrayBuffer) =>
  Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;

const CODE = '135790';
let env: Env;

beforeEach(() => {
  env = {
    DB: fakeD1(),
    ASSETS: { fetch: async () => new Response('page') } as unknown as Fetcher,
    PIN_DANA: CODE,
    PIN_NOA: '246802',
  };
});

async function api(
  path: string,
  { body, code = CODE, ip = '1.1.1.1' }: { body?: unknown; code?: string | null; ip?: string } = {},
) {
  const headers: Record<string, string> = { 'CF-Connecting-IP': ip };
  if (code) headers.Authorization = `Bearer ${code}`;
  const response = await worker.fetch(
    new Request(`https://dreamjapan.test/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
  );
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

const changes = async () => (await api('/changes', { code: null })).body;

describe('worker', () => {
  it('serves the seeded changes, and says when nothing changed', async () => {
    const all = await changes();
    expect(all.version).toBe(1);
    expect(Object.keys(all.events as object)).toContain('d3-04');
    expect(all.lists).toEqual({});
    expect((await api('/changes?since=1', { code: null })).body).toEqual({
      version: 1,
      unchanged: true,
    });
  });

  it('locks out one address after too many wrong codes, and only that address', async () => {
    for (let i = 0; i < MAX_FAILURES; i += 1) {
      expect((await api('/me', { code: '000000', ip: '6.6.6.6' })).status).toBe(401);
    }
    expect((await api('/me', { ip: '6.6.6.6' })).status).toBe(429);
    expect((await api('/me', { ip: '2.2.2.2' })).body).toEqual({ who: 'dana' });
  });

  it('clears an address’s count after a right code', async () => {
    for (let i = 0; i < MAX_FAILURES - 1; i += 1) await api('/me', { code: '000000' });
    expect((await api('/me')).status).toBe(200);
    for (let i = 0; i < MAX_FAILURES - 1; i += 1) await api('/me', { code: '000000' });
    expect((await api('/me')).status).toBe(200);
  });

  it('refuses entries the app could not show', async () => {
    const bad = [
      { kind: 'events', key: 'd3-05', data: { time: '9:5' } },
      { kind: 'events', key: 'd3-05', data: { colour: 'pink' } },
      { kind: 'expenses', key: 'x', data: { amount: -3 } },
      { kind: 'added', key: 'live-a', data: { id: 'live-b', title: 'x' } },
      { kind: 'nope', key: 'x', data: {} },
      { kind: 'events', key: 'bad key!', data: {} },
      { changes: [] },
      {
        changes: Array.from({ length: 11 }, (_, i) => ({ kind: 'lists', key: `l${i}`, data: {} })),
      },
    ];
    for (const body of bad) expect((await api('/change', { body })).status).toBe(400);
    expect((await changes()).version).toBe(1);
  });

  it('keeps settle-ups, and refuses one with a missing field or to the same person', async () => {
    const payment = {
      from: 'noa',
      to: 'dana',
      currency: 'ILS',
      amount: 200,
      date: '2037-11-04',
      at: 1,
    };
    const save = (data: unknown) =>
      api('/change', { body: { kind: 'payments', key: 'p-1', data } });
    expect((await save({ ...payment, to: 'noa' })).status).toBe(400);
    expect((await save({ ...payment, date: undefined })).status).toBe(400);
    expect((await save({ ...payment, note: 'Bit', addedBy: 'noa' })).status).toBe(200);
    expect((await changes()).payments).toEqual({
      'p-1': { ...payment, note: 'Bit', addedBy: 'noa' },
    });
    // A cost with exact parts and a fixed shekel value; parts can be cleared again.
    const cost = { kind: 'expenses', key: 'c-1' };
    const data = { title: 'Ramen', category: 'food', currency: 'JPY', amount: 3000 };
    expect(
      (
        await api('/change', {
          body: { ...cost, data: { ...data, shekels: 58, parts: { dana: 2000, noa: 1000 } } },
        })
      ).status,
    ).toBe(200);
    expect(
      (await api('/change', { body: { ...cost, data: { parts: null }, merge: true } })).status,
    ).toBe(200);
    expect(
      (await api('/change', { body: { ...cost, data: { parts: { dana: 1 } }, merge: true } }))
        .status,
    ).toBe(400);
  });

  it('merges only the fields sent, and returns the new version', async () => {
    const item = { kind: 'listItems', key: 'item-1' };
    await api('/change', { body: { ...item, data: { list: 'pack', text: 'Socks' } } });
    const { body } = await api('/change', { body: { ...item, data: { done: true }, merge: true } });
    expect(body.version).toBe(3);
    expect((await changes()).listItems).toEqual({
      'item-1': { list: 'pack', text: 'Socks', done: true },
    });
  });

  it('undoes a whole save, never the undo itself, and only the asked entry', async () => {
    const before = (await changes()).events as Record<string, Row>;
    await api('/change', {
      body: {
        changes: [
          { kind: 'events', key: 'd3-04', data: { time: '18:00' }, merge: true },
          { kind: 'events', key: 'd3-05', data: { time: '15:30' }, merge: true },
        ],
      },
    });
    await api('/change', { body: { kind: 'listItems', key: 'tick', data: { done: true } } });

    // Undo for one stop leaves the list tick made after it alone.
    expect((await api('/undo', { body: { kind: 'events', key: 'd3-05' } })).status).toBe(200);
    let now = await changes();
    expect((now.events as Record<string, Row>)['d3-04']).toEqual(before['d3-04']);
    expect((now.events as Record<string, Row>)['d3-05']).toBeUndefined();
    expect(now.listItems).toEqual({ tick: { done: true } });

    // A plain undo now takes the tick back, and the next one finds nothing of ours left.
    await api('/undo', { body: {} });
    now = await changes();
    expect(now.listItems).toEqual({});
    expect((await api('/undo', { body: { kind: 'listItems' } })).status).toBe(404);
  });

  it('leaves out a row it cannot read instead of failing', async () => {
    await env.DB.prepare(
      "INSERT INTO lists (key, data, updated_at, updated_by) VALUES ('broken', 'not json', '', '')",
    ).run();
    expect((await changes()).lists).toEqual({});
  });

  it('keeps a photo for everyone, and refuses one without a code, too big or not a photo', async () => {
    const upload = (bytes: Uint8Array, code: string | null = CODE) =>
      worker.fetch(
        new Request('https://dreamjapan.test/api/photo', {
          method: 'POST',
          headers: {
            'CF-Connecting-IP': '1.1.1.1',
            ...(code && { Authorization: `Bearer ${code}` }),
          },
          body: bytes,
        }),
        env,
      );
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, ...Array(70_000).fill(7)]);
    expect((await upload(jpeg, null)).status).toBe(401);
    expect((await upload(Uint8Array.from([1, 2, 3, 4]))).status).toBe(415);
    expect((await upload(new Uint8Array(MAX_PHOTO_BYTES + 1).fill(0xff))).status).toBe(413);

    const saved = await upload(jpeg);
    const { id } = (await saved.json()) as { id: string };
    const photo = await worker.fetch(new Request(`https://dreamjapan.test/api/photo/${id}`), env);
    expect(photo.headers.get('Content-Type')).toBe('image/jpeg');
    expect(photo.headers.get('Cache-Control')).toContain('immutable');
    expect(new Uint8Array(await photo.arrayBuffer())).toEqual(jpeg);
    const missing = await worker.fetch(new Request('https://dreamjapan.test/api/photo/nope'), env);
    expect(missing.status).toBe(404);

    // An item points at it by id; anything else in `photo` is refused.
    const item = (photo: unknown) =>
      api('/change', { body: { kind: 'listItems', key: 'item-1', data: { photo } } });
    expect((await item(id)).status).toBe(200);
    expect((await item('no spaces allowed')).status).toBe(400);
    expect((await item('')).status).toBe(200);
  });

  it('serves the page for everything outside /api', async () => {
    const response = await worker.fetch(new Request('https://dreamjapan.test/'), env);
    expect(await response.text()).toBe('page');
  });
});
