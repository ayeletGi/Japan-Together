/**
 * What the live database may hold, shared by the Worker (which refuses anything else) and the app
 * (which skips anything else in a copy it reads). `live-kinds.json` also feeds `scripts/live.mjs`.
 */
import config from './live-kinds.json' with { type: 'json' };

export const LIVE_TABLES = config.tables;
export type LiveKind = keyof typeof LIVE_TABLES;
export const LIVE_KINDS = Object.keys(LIVE_TABLES) as LiveKind[];
/** Entries one save may hold; one undo reverts them together. */
export const MAX_ENTRIES = config.maxEntries;
export const MAX_DATA_CHARS = config.maxDataChars;
export const KEY_PATTERN = new RegExp(config.keyPattern);
/** A list-item entry whose key starts like this is a link (see `of`). */
export const LINK_PREFIX = 'link.';

export const isLiveKind = (value: unknown): value is LiveKind =>
  typeof value === 'string' && Object.hasOwn(LIVE_TABLES, value);

/** "HH:MM", 00:00–23:59. */
export const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Check = (value: unknown) => boolean;

const text =
  (max = 5000): Check =>
  (value) =>
    typeof value === 'string' && value.length <= max;
const flag: Check = (value) => typeof value === 'boolean';
const number: Check = (value) => typeof value === 'number' && Number.isFinite(value);
const amount: Check = (value) => number(value) && (value as number) >= 0;
const clockOrNull: Check = (value) =>
  value === null || (typeof value === 'string' && CLOCK.test(value));
const oneOf =
  (...values: readonly unknown[]): Check =>
  (value) =>
    values.includes(value);
const date: Check = (value) => typeof value === 'string' && DATE.test(value);
const key: Check = (value) => typeof value === 'string' && KEY_PATTERN.test(value);
const tags: Check = (value) => Array.isArray(value) && value.length <= 20 && value.every(text(200));
const https: Check = (value) => typeof value === 'string' && /^https:\/\/\S+$/.test(value);
const webAddress: Check = (value) => text(2000)(value) && /^https?:\/\/\S+$/i.test(value as string);

const EVENT_STATUS = ['confirmed', 'planned', 'todo', 'needs-check'] as const;
const CURRENCY = ['ILS', 'JPY', 'USD'] as const;
const TRAVELLER = ['dana', 'noa'] as const;
const WHO = ['dana', 'noa', 'claude'] as const;
/** Whose list it is: one of us, or both of us together. */
export const LIST_OWNERS = ['dana', 'noa', 'both'] as const;
export type ListOwner = (typeof LIST_OWNERS)[number];
/** Kept in step with `CostCategory` in src/data/budget.ts. */
export const COST_CATEGORIES = [
  'flight',
  'hotel',
  'train',
  'attraction',
  'food',
  'shopping',
  'treatment',
  'guide',
  'other',
] as const;
const nullable =
  (check: Check): Check =>
  (value) =>
    value === null || check(value);
/** Exact parts of a cost, in its own currency: `{ dana, noa }`. */
const parts: Check = (value) => {
  const record = value as Record<string, unknown> | null;
  return (
    !!record &&
    typeof record === 'object' &&
    Object.keys(record).length === 2 &&
    amount(record.dana) &&
    amount(record.noa)
  );
};

interface Shape {
  fields: Record<string, Check>;
  required?: readonly string[];
}

const eventFields = {
  title: text(300),
  time: clockOrNull,
  end: clockOrNull,
  place: text(300),
  note: text(),
};

const SHAPES: Record<LiveKind, Shape> = {
  events: {
    fields: {
      ...eventFields,
      placeLabel: text(100),
      status: oneOf(...EVENT_STATUS),
      displayTitle: text(300),
      displayDescription: text(),
      removed: flag,
      why: text(),
    },
  },
  added: {
    fields: {
      ...eventFields,
      id: key,
      date,
      city: text(100),
      status: oneOf(...EVENT_STATUS),
      kind: text(40),
      source: text(100),
      priority: flag,
      special: (value) => value === null || text(100)(value),
      timeGcal: clockOrNull,
      endGcal: clockOrNull,
      calendarDisabled: flag,
    },
    required: [
      'id',
      'title',
      'time',
      'end',
      'date',
      'city',
      'status',
      'kind',
      'place',
      'note',
      'source',
      'priority',
      'special',
    ],
  },
  days: {
    fields: { route: text(), headline: text(500), extraTags: tags, why: text() },
  },
  expenses: {
    fields: {
      dateLabel: text(100),
      title: text(300),
      category: oneOf(...COST_CATEGORIES),
      currency: oneOf(...CURRENCY),
      amount,
      original: (value) => {
        const original = value as { amount?: unknown; currency?: unknown } | null;
        return (
          !!original &&
          typeof original === 'object' &&
          Object.keys(original).every((field) => field === 'amount' || field === 'currency') &&
          amount(original.amount) &&
          oneOf(...CURRENCY)(original.currency)
        );
      },
      discount: amount,
      owner: oneOf('both', 'dana', 'noa', 'unassigned'),
      state: oneOf('paid', 'reserved', 'onSite'),
      paidBy: oneOf(...TRAVELLER),
      settled: flag,
      estimate: flag,
      outsideTrip: flag,
      note: text(),
      date: nullable(date),
      shekels: nullable(amount),
      parts: nullable(parts),
      at: number,
      addedBy: oneOf(...WHO),
      removed: flag,
    },
  },
  payments: {
    fields: {
      from: oneOf(...TRAVELLER),
      to: oneOf(...TRAVELLER),
      currency: oneOf('ILS', 'JPY'),
      amount,
      shekels: nullable(amount),
      date,
      note: text(500),
      at: number,
      addedBy: oneOf(...WHO),
    },
    required: ['from', 'to', 'currency', 'amount', 'date', 'at'],
  },
  photoFolders: { fields: { url: https }, required: ['url'] },
  lists: {
    fields: { name: text(200), order: number, owner: oneOf(...LIST_OWNERS), removed: flag },
  },
  listItems: {
    fields: {
      list: key,
      text: text(500),
      note: text(1000),
      category: text(60),
      /** A photo's id (`/api/photo/<id>`), or '' for none. */
      photo: (value) => value === '' || key(value),
      /** A web address, or '' for none. */
      link: (value) => value === '' || webAddress(value),
      done: flag,
      /**
       * A link: this entry puts item `of` in `list` too (one item, not a copy), with its own tick
       * there. Apps from before links skip it, so they still show the item in its own list.
       */
      of: key,
      at: number,
      removed: flag,
    },
  },
};

/** The fields a cost needs when it isn't an edit of one already in `budget.ts`. */
export const NEW_EXPENSE_FIELDS = ['title', 'category', 'currency', 'amount', 'owner', 'state'];

/** What is wrong with an entry of the live database, or null when it is fine. */
export function entryProblem(kind: LiveKind, entryKey: string, data: unknown): string | null {
  if (!KEY_PATTERN.test(entryKey)) return 'bad key';
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'data must be an object';
  const { fields, required = [] } = SHAPES[kind];
  const record = data as Record<string, unknown>;
  for (const [field, value] of Object.entries(record)) {
    const check = fields[field];
    if (!check) return `unknown field ${field}`;
    if (!check(value)) return `bad ${field}`;
  }
  const missing = required.find((field) => !(field in record));
  if (missing) return `missing ${missing}`;
  // A tick merged into a link that was just removed would leave a bare {done}: refuse it instead.
  if (kind === 'listItems' && entryKey.startsWith(LINK_PREFIX) && !(record.of && record.list)) {
    return 'a link needs of and list';
  }
  if (kind === 'payments' && record.from === record.to) return 'a payment goes to the other one';
  if (kind === 'added' && (record.id !== entryKey || !entryKey.startsWith('live-'))) {
    return 'an added activity needs an id starting with live-, the same as its key';
  }
  return null;
}
