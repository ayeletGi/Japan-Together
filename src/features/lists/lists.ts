import { LINK_PREFIX, MAX_ENTRIES, type ListOwner } from '../../../shared/liveSchema';
import type { ListChange, ListItemChange, LiveChanges } from '../../data/live';
import type { Language } from '../../i18n';
import { checklistGroups } from '../checklist/items';

/**
 * Our shared lists. The four we start with, and the before-the-flight checklist's items, are in
 * code; everything we add, tick, edit or remove lives in the live database (`lists` and
 * `listItems`, see src/data/live.ts), so both phones see the same lists.
 */

/** The lists in code take their name from the translations (`lists.presets.*`). */
export type Preset = 'flight' | 'pack' | 'giftsDana' | 'giftsNoa';

const PRESET_LISTS: { id: string; preset: Preset; owner: ListOwner }[] = [
  { id: 'flight', preset: 'flight', owner: 'both' },
  { id: 'pack', preset: 'pack', owner: 'both' },
  { id: 'gifts-dana', preset: 'giftsDana', owner: 'dana' },
  { id: 'gifts-noa', preset: 'giftsNoa', owner: 'noa' },
];

/** Each person's own gift list, by the name the server gives their code. */
export const GIFT_LIST: Record<string, string> = { dana: 'gifts-dana', noa: 'gifts-noa' };

export const FLIGHT_LIST = 'flight';
/** The list last opened on this phone. */
export const OPEN_LIST_KEY = 'lists.open';

export const isGiftList = (preset: Preset | undefined) =>
  preset === 'giftsDana' || preset === 'giftsNoa';

export interface Item {
  id: string;
  text: string;
  note: string;
  /** Ticked in the list it is shown in; each list has its own tick. */
  done: boolean;
  /** The before-the-flight group it came from (built-in items only). */
  group?: string;
  /** '' when it has none. A built-in item starts in its group and can be moved. */
  category: string;
  /** Its photo's id (see `photoUrl`), '' for none. */
  photo: string;
  /** A web address typed in its own box, '' for none (older items keep theirs in the words). */
  link: string;
  /** Its own list: the one it was added to (built-in items: before the flight) or moved to. */
  home: string;
  /** Every list it is in, `home` first while that list is still here: one item, not copies. */
  lists: string[];
  /** The lists it is ticked in. */
  doneIn: string[];
  /** Deleted lists it is still linked to: those links are cleared with its next edit. */
  goneLinks: string[];
}

export interface List {
  id: string;
  preset?: Preset;
  /** Set for lists we made or renamed; otherwise the preset's translation. */
  name?: string;
  /** Whose list it is: a built-in list's own unless changed, else both of ours. */
  owner: ListOwner;
  items: Item[];
}

type ListData = Pick<LiveChanges, 'lists' | 'listItems'>;

/** Where a list sits until it is moved: the built-in ones in their own order, the rest after. */
const defaultOrder = (id: string) => {
  const index = PRESET_LISTS.findIndex((preset) => preset.id === id);
  return index >= 0 ? index : PRESET_LISTS.length;
};

const builtInId = (id: string) => `${FLIGHT_LIST}.${id}`;

/** All lists that weren't removed, in order, with their items. */
export function buildLists({ lists, listItems }: ListData, lang: Language): List[] {
  const all: (List & { order: number })[] = [];
  for (const { id, preset, owner } of PRESET_LISTS) {
    const change = lists[id];
    if (change?.removed) continue;
    all.push({
      id,
      preset,
      name: change?.name,
      owner: change?.owner ?? owner,
      order: change?.order ?? defaultOrder(id),
      items: [],
    });
  }
  for (const [id, change] of Object.entries(lists)) {
    if (change.removed || all.some((list) => list.id === id)) continue;
    all.push({
      id,
      name: change.name ?? '',
      owner: change.owner ?? 'both',
      order: change.order ?? defaultOrder(id),
      items: [],
    });
  }
  all.sort((a, b) => a.order - b.order);

  // Each item's other lists, from its links.
  const linked = new Map<string, string[]>();
  for (const change of Object.values(listItems)) {
    if (change.of && change.list)
      linked.set(change.of, [...(linked.get(change.of) ?? []), change.list]);
  }
  const exists = (id: string) => all.some((list) => list.id === id);

  // The item in its own list and in every other one it is in, each with that list's tick.
  const place = (
    item: Omit<Item, 'done' | 'lists' | 'doneIn' | 'goneLinks'>,
    change: ListItemChange | undefined,
  ) => {
    const links = (linked.get(item.id) ?? []).filter((id) => id !== item.home);
    const lists = [item.home, ...links].filter(exists);
    const doneIn = lists.filter((id) =>
      id === item.home ? change?.done : listItems[linkKey(id, item.id)]?.done,
    );
    const goneLinks = links.filter((id) => !exists(id));
    // Each list gets a copy of its own, arrays too, so changing one never changes the others.
    for (const list of all) {
      if (lists.includes(list.id)) {
        list.items.push({
          ...item,
          lists: [...lists],
          doneIn: [...doneIn],
          goneLinks: [...goneLinks],
          done: doneIn.includes(list.id),
        });
      }
    }
  };

  for (const group of checklistGroups) {
    for (const item of group.items) {
      const id = builtInId(item.id);
      const change = listItems[id];
      if (change?.removed) continue;
      place(
        {
          id,
          text: change?.text ?? item.title[lang],
          note: change?.note ?? item.sub?.[lang] ?? '',
          group: group.id,
          category: change?.category?.trim() ?? group.id,
          photo: change?.photo ?? '',
          link: change?.link ?? '',
          // Moved out of before-the-flight, it keeps its id and both languages; if the list it
          // was moved to is gone, it is back in before-the-flight.
          home: change?.list && exists(change.list) ? change.list : FLIGHT_LIST,
        },
        change,
      );
    }
  }

  const added = Object.entries(listItems)
    .filter(
      ([id, change]) =>
        !id.startsWith(`${FLIGHT_LIST}.`) && !change.removed && !change.of && change.list,
    )
    .sort(([, a], [, b]) => (a.at ?? 0) - (b.at ?? 0));
  for (const [id, change] of added) {
    place(
      {
        id,
        text: change.text ?? '',
        note: change.note ?? '',
        category: change.category?.trim() ?? '',
        photo: change.photo ?? '',
        link: change.link ?? '',
        home: change.list!,
      },
      change,
    );
  }

  return all.map(({ id, preset, name, owner, items }) => ({ id, preset, name, owner, items }));
}

export interface Progress {
  done: number;
  total: number;
  /** The first item not done yet, in list order; null when everything is. */
  next: Item | null;
}

/** Points for each item ticked, like the daily stamp rally's points per stamp. */
export const POINTS_PER_ITEM = 10;

/** A group's points: every ticked item in its lists. */
export const groupPoints = (lists: List[], owner: ListOwner) =>
  lists
    .filter((list) => list.owner === owner)
    .reduce((sum, list) => sum + listProgress(list).done, 0) * POINTS_PER_ITEM;

export function listProgress(list: List | undefined): Progress {
  const items = list?.items ?? [];
  return {
    done: items.filter((item) => item.done).length,
    total: items.length,
    next: items.find((item) => !item.done) ?? null,
  };
}

/** The list's own items (not the built-in checklist), still to do first. */
export function addedItems(list: List): Item[] {
  return list.items.filter((item) => !item.group).sort((a, b) => Number(a.done) - Number(b.done));
}

/**
 * The categories each list starts with, as keys: the before-the-flight groups, or names from the
 * translations (`lists.categories.*`). Anything else we type is kept as we typed it.
 */
const PACK_CATEGORIES = ['clothes', 'toiletries', 'electronics', 'documents', 'meds'] as const;
const GIFT_CATEGORIES = ['family', 'friends', 'work', 'us'] as const;
export type CategoryKey = (typeof PACK_CATEGORIES)[number] | (typeof GIFT_CATEGORIES)[number];

const PRESET_CATEGORIES: Record<Preset, readonly string[]> = {
  flight: checklistGroups.map((group) => group.id),
  pack: PACK_CATEGORIES,
  giftsDana: GIFT_CATEGORIES,
  giftsNoa: GIFT_CATEGORIES,
};

const presetCategories = (listId: string): readonly string[] => {
  const preset = PRESET_LISTS.find((each) => each.id === listId)?.preset;
  return preset ? PRESET_CATEGORIES[preset] : [];
};

/** Whether this is a key named in the translations (`lists.categories.*`), not a group's id. */
export const isCategoryKey = (category: string): category is CategoryKey =>
  ([...PACK_CATEGORIES, ...GIFT_CATEGORIES] as readonly string[]).includes(category);

/** Whether this category is one of this list's own keys, so it may mean nothing in another. */
export const isPresetCategory = (list: List, category: string) =>
  presetCategories(list.id).includes(category);

/**
 * Whether a category in this list is a key to translate: this list's own, or one an item here
 * brought along from another list it is in. Words typed here stay as typed, unless such an item
 * in this list has the same key (then the section is that key either way).
 */
export const isTranslatedCategory = (list: List, category: string) =>
  isPresetCategory(list, category) ||
  list.items.some(
    (item) =>
      item.category === category &&
      item.lists.some((id) => presetCategories(id).includes(category)),
  );

/**
 * A key of a list it is leaving, once none of the lists left owns it, means nothing there (it
 * would show as the bare key): the item goes without a category. Typed words are kept.
 */
const keptCategory = (item: Item, category: string, wanted: readonly string[]) =>
  item.lists.some((id) => presetCategories(id).includes(category)) &&
  !wanted.some((id) => presetCategories(id).includes(category))
    ? ''
    : category;

/** A category from the old list's own set means nothing in another list; typed ones go along. */
export const carriedCategory = (from: List, to: List, category: string) =>
  isPresetCategory(from, category) && !categoryChoices(to).includes(category) ? '' : category;

/** The categories to pick from: the list's own first, then the ones we added, in first-use order. */
export function categoryChoices(list: List): string[] {
  const preset = presetCategories(list.id);
  return [...new Set([...preset, ...list.items.map((item) => item.category)])].filter(Boolean);
}

export interface Section {
  /** '' for the items with no category, always last. */
  category: string;
  items: Item[];
}

/**
 * The list by category, ticked items at the bottom of each. Otherwise built-in items keep their
 * order and our own come after them. Categories with nothing in them are left out.
 */
export function listSections(list: List): Section[] {
  const builtIn = list.items.filter((item) => item.group);
  const own = list.items.filter((item) => !item.group);
  const inCategory = (category: string) =>
    [...builtIn, ...own]
      .filter((item) => item.category === category)
      .sort((a, b) => Number(a.done) - Number(b.done));
  return [...categoryChoices(list), '']
    .map((category) => ({ category, items: inCategory(category) }))
    .filter((section) => section.items.length > 0);
}

/** How words are compared in a search: case, accents and Hebrew vowel marks set aside. */
const searchable = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u0591-\u05c7]/g, '')
    .toLocaleLowerCase();

/**
 * The list's items whose name, note or category has every word typed, in list order (open
 * ones first). An empty search finds nothing to filter, so it gives every item.
 */
export function searchItems(
  list: List,
  query: string,
  categoryName: (category: string) => string = (category) => category,
): Item[] {
  const words = searchable(query).split(/\s+/).filter(Boolean);
  const items = listSections(list).flatMap((section) => section.items);
  const ordered = [...items.filter((item) => !item.done), ...items.filter((item) => item.done)];
  if (words.length === 0) return ordered;
  return ordered.filter((item) => {
    const haystack = searchable(
      [item.text, item.note, item.link, item.category && categoryName(item.category)].join(' '),
    );
    return words.every((word) => haystack.includes(word));
  });
}

/* Links: a web address typed or pasted in an item's name or note opens from its card. */

/**
 * An address runs to a space, or to what is never in one as pasted: Hebrew letters, the
 * direction marks right-to-left apps copy along, and Japanese punctuation.
 */
const LINK_PATTERN = /https?:\/\/[^\s<>"֐-׿‎‏‪-‮⁦-⁩、。「」（）]+/i;
/** Ad and tracking parts of a shop's address: they only make it long. */
const TRACKING = /^(utm_|saf_|gad_|gclid$|gbraid$|wbraid$|fbclid$|msclkid$|_gl$)/i;
/** Google Shopping ads (`saf_…`) add the advertiser's account too; elsewhere it may be needed. */
const SHOPPING_AD = /^saf_/i;
const SHOPPING_ACCOUNT = /^account_id$/i;

/** The punctuation typed right after an address. A bracket closing one inside it is its own. */
function trailingOf(link: string): string {
  let end = link.length;
  const unclosed = (open: string, close: string) =>
    link.slice(0, end).split(close).length > link.slice(0, end).split(open).length;
  while (end > 0) {
    const last = link[end - 1];
    const typed =
      '.,;:!?'.includes(last) ||
      (last === ')' && unclosed('(', ')')) ||
      (last === ']' && unclosed('[', ']'));
    if (!typed) break;
    end -= 1;
  }
  return link.slice(end);
}

/**
 * The address without its tracking parts (or the punctuation typed after it). The rest of it is
 * kept exactly as typed: shops and signed links may refuse it written any other way.
 */
export function cleanLink(link: string): string {
  const address = link.slice(0, link.length - trailingOf(link).length);
  const hashAt = address.indexOf('#');
  const main = hashAt < 0 ? address : address.slice(0, hashAt);
  const hash = hashAt < 0 ? '' : address.slice(hashAt);
  const queryAt = main.indexOf('?');
  if (queryAt < 0) return address;
  const parts = main.slice(queryAt + 1).split('&');
  const key = (part: string) => part.split('=')[0];
  const shoppingAd = parts.some((part) => SHOPPING_AD.test(key(part)));
  const kept = parts.filter(
    (part) => !TRACKING.test(key(part)) && !(shoppingAd && SHOPPING_ACCOUNT.test(key(part))),
  );
  if (kept.length === parts.length) return address;
  return main.slice(0, queryAt) + (kept.length > 0 ? `?${kept.join('&')}` : '') + hash;
}

/** The text with every address in it cleaned, so a pasted shop link fits. */
export const cleanLinks = (text: string) =>
  text.replace(new RegExp(LINK_PATTERN.source, 'gi'), (link) => cleanLink(link) + trailingOf(link));

export interface ItemView {
  /** The name to show: without the address; the site's name when the address was all of it. */
  text: string;
  note: string;
  /** Its link box, else the first address in its name, else in its note; '' for none. */
  link: string;
}

/** An item as its card shows it: its address taken out of the words, to open from a button. */
export function itemView(item: Pick<Item, 'text' | 'note'> & { link?: string }): ItemView {
  if (item.link) return { text: item.text, note: item.note, link: item.link };
  const without = (words: string, link: string) =>
    words
      .replace(link, ' ')
      // Spaces left around it go; the note's line breaks stay.
      .replace(/[^\S\n]+/g, ' ')
      .trim();
  const inText = item.text.match(LINK_PATTERN)?.[0];
  const found = inText ?? item.note.match(LINK_PATTERN)?.[0];
  if (!found) return { text: item.text, note: item.note, link: '' };
  const link = cleanLink(found);
  const text = inText ? without(item.text, found) : item.text;
  let site = link;
  try {
    site = new URL(link).hostname.replace(/^www\./, '');
  } catch {
    // Not a real address: show it as typed.
  }
  return {
    text: text || site,
    note: inText ? item.note : without(item.note, found),
    link,
  };
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* What to save for each action, as `{ key: data }` (null removes the entry). */

export function newList(
  data: ListData,
  name: string,
  owner: ListOwner,
): { id: string; change: ListChange } {
  const orders = Object.values(data.lists).map((list) => list.order ?? 0);
  return {
    id: `list-${newId()}`,
    change: { name: name.trim(), owner, order: Math.max(PRESET_LISTS.length, ...orders) + 1 },
  };
}

/* Each holds only the fields that change; the server merges them into what it has. */

export const renameList = (id: string, name: string): Record<string, ListChange> => ({
  [id]: { name: name.trim() },
});

/** A list moved to another of us (or to both), with its new name too if it has one. */
export const moveList = (
  id: string,
  owner: ListOwner,
  name?: string,
): Record<string, ListChange> => ({
  [id]: name === undefined ? { owner } : { owner, name: name.trim() },
});

/** `ids` with the one at `from` moved to `to`. */
export function moveId(ids: readonly string[], from: number, to: number): string[] {
  const next = [...ids];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/**
 * All the lists' order once one group's lists are in `group`'s order: they take the places that
 * group's lists had, so the other groups' lists stay where they were.
 */
export function orderWithGroup(all: readonly string[], group: readonly string[]): string[] {
  const next = [...group];
  return all.map((id) => (group.includes(id) ? next.shift()! : id));
}

/** The lists in this order: each gets its place as `order`, only where that changed. */
export function reorderLists(data: ListData, ids: readonly string[]): Record<string, ListChange> {
  const changes: Record<string, ListChange> = {};
  ids.forEach((id, order) => {
    if ((data.lists[id]?.order ?? defaultOrder(id)) !== order) changes[id] = { order };
  });
  return changes;
}

/** `order` with lists that went away dropped and ones that appeared meanwhile added at the end. */
export function reconcileOrder(order: readonly string[], ids: readonly string[]): string[] {
  return [...order.filter((id) => ids.includes(id)), ...ids.filter((id) => !order.includes(id))];
}

export const removeList = (id: string): Record<string, ListChange> => ({ [id]: { removed: true } });

/** What the add and edit forms give an item; left out, it stays as it was (or empty when new). */
export interface ItemFields {
  text: string;
  note: string;
  category: string;
  /** All the lists it should be in (edits only). */
  lists: readonly string[];
  /** The photo's id, '' for none. */
  photo: string;
  /** A web address, '' for none. */
  link: string;
}

/**
 * An address typed in the link box, cleaned; one without `https://` gets it. '' when what was typed
 * is not an address, so the server never refuses the item for it.
 */
export function boxLink(typed: string): string {
  const trimmed = typed.trim();
  if (!trimmed) return '';
  const address = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const found = address.match(LINK_PATTERN)?.[0];
  return found === address ? cleanLink(address) : '';
}

export function newItem(
  listId: string,
  { text = '', note = '', category = '', photo = '', link = '' }: Partial<ItemFields>,
): Record<string, ListItemChange> {
  link = boxLink(link);
  return {
    [`item-${newId()}`]: {
      list: listId,
      text: cleanLinks(text.trim()),
      note: cleanLinks(note.trim()),
      ...(category.trim() && { category: category.trim() }),
      ...(photo && { photo }),
      // Left out when empty: phones still on an app from before link boxes skip items with one.
      ...(link && { link }),
      done: false,
      at: Date.now(),
    },
  };
}

/** A short stable hash, so a link's key fits the key limit whatever the ids. */
function hashOf(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    a = Math.imul(a ^ code, 0x01000193);
    b = Math.imul(b ^ code, 0x5bd1e995);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}

/**
 * The entry that puts an item in a list other than its own, with its tick there. One entry per
 * list, so two phones linking or ticking it in different lists at once never overwrite each other.
 */
export const linkKey = (listId: string, itemId: string) =>
  `${LINK_PREFIX}${hashOf(`${listId} ${itemId}`)}`;

/** Ticks the item in this list only. */
export function setDone(item: Item, listId: string, done: boolean): Record<string, ListItemChange> {
  return { [listId === item.home ? item.id : linkKey(listId, item.id)]: { done } };
}

/**
 * The most lists one item can be in: an edit moving it from this many to as many others, with a
 * new list made on the way, still fits in one save (`MAX_ENTRIES`).
 */
export const MAX_ITEM_LISTS = Math.floor(MAX_ENTRIES / 2);

/**
 * Its links to these lists, cleared, and to deleted lists as far as the save has room (`used`
 * entries are taken); the rest go with a later save.
 */
const unlink = (item: Item, lists: readonly string[], used: number) =>
  Object.fromEntries(
    [...lists, ...item.goneLinks.slice(0, Math.max(0, MAX_ENTRIES - used - lists.length))].map(
      (id) => [linkKey(id, item.id), null],
    ),
  );

/**
 * Only what was changed: editing a built-in item's note alone keeps its text in both languages.
 * Empty when nothing changed. `lists` are all the lists it should be in (at least one; none
 * changes nothing): it keeps its own list while that is one of them, else the first becomes its
 * own, and each list keeps its tick. `photo` is the new photo's id, or '' to take it off.
 */
export function editItem(
  item: Item,
  {
    text = item.text,
    note = item.note,
    category = item.category,
    lists = item.lists,
    photo = item.photo,
    link = item.link,
  }: Partial<ItemFields>,
): Record<string, ListItemChange | null> {
  const wanted = [...new Set(lists)];
  if (wanted.length === 0) return {};
  category = keptCategory(item, category, wanted);
  const home = wanted.includes(item.home) ? item.home : wanted[0];
  // A list it was linked to keeps its tick as its own list; one it wasn't in takes the tick along.
  const done = item.doneIn.includes(item.lists.includes(home) ? home : item.home);
  text = cleanLinks(text);
  note = cleanLinks(note);
  const change: ListItemChange = {};
  if (text.trim() !== item.text) change.text = text.trim();
  if (note.trim() !== item.note) change.note = note.trim();
  if (category.trim() !== item.category) change.category = category.trim();
  if (photo !== item.photo) change.photo = photo;
  // Words that are not an address leave its link as it was; only an emptied box takes it off.
  link = link.trim() ? boxLink(link) || item.link : '';
  if (link !== item.link) change.link = link;
  if (home !== item.home) change.list = home;
  if (done !== item.doneIn.includes(item.home)) change.done = done;
  const dropped = item.lists.filter(
    (id) => id !== item.home && (id === home || !wanted.includes(id)),
  );
  const added = wanted.filter((id) => id !== home && !item.lists.includes(id));
  return {
    // Room kept for the item itself and a new list saved with it.
    ...unlink(item, dropped, added.length + 2),
    ...Object.fromEntries(
      added.map((id) => [linkKey(id, item.id), { of: item.id, list: id, done: false }]),
    ),
    ...(Object.keys(change).length > 0 && { [item.id]: change }),
  };
}

/** Built-in items are hidden; our own are deleted. Its links to other lists go too. */
export const removeItem = (item: Item): Record<string, ListItemChange | null> => ({
  ...unlink(
    item,
    item.lists.filter((id) => id !== item.home),
    1,
  ),
  [item.id]: item.group ? { removed: true } : null,
});

/** Takes it out of this list only; when it is in no other list, it is removed. */
export const removeFrom = (item: Item, listId: string) =>
  item.lists.length > 1
    ? editItem(item, { lists: item.lists.filter((id) => id !== listId) })
    : removeItem(item);

/** Before-the-flight ticks kept on a phone before the lists were shared, as ticks to save. */
export function oldTicks(data: ListData, ticks: readonly string[]): Record<string, ListItemChange> {
  const known = new Set(checklistGroups.flatMap((group) => group.items.map((item) => item.id)));
  const entries: Record<string, ListItemChange> = {};
  for (const tick of ticks) {
    const id = builtInId(tick);
    // An item moved to another list ticks before-the-flight through its link, if it has one.
    const moved = data.listItems[id]?.list;
    const away = !!moved && moved !== FLIGHT_LIST && !data.lists[moved]?.removed;
    const key = away ? linkKey(FLIGHT_LIST, id) : id;
    if (!known.has(tick) || data.listItems[key]?.done || (away && !data.listItems[key])) continue;
    entries[key] = { done: true };
  }
  return entries;
}

/** A gift as a phone kept it before the lists were shared. */
export interface OldGift {
  id: string;
  for: string;
  what: string;
  bought: boolean;
}

/**
 * Gifts kept on a phone before the lists were shared, as items of that person's gift list.
 * Each keeps its old id, so moving them again after a cut-off try adds nothing twice.
 */
export function oldGifts(
  data: ListData,
  listId: string,
  gifts: readonly OldGift[],
): Record<string, ListItemChange> {
  const entries: Record<string, ListItemChange> = {};
  const start = Date.now();
  gifts.forEach((gift, index) => {
    const id = `item-old-${gift.id}`.replace(/[^\w.:-]/g, '').slice(0, 80);
    if (data.listItems[id]) return;
    entries[id] = {
      list: listId,
      text: gift.what || gift.for,
      note: gift.what ? gift.for : '',
      done: gift.bought,
      at: start + index,
    };
  });
  return entries;
}
