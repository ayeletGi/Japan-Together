import { describe, expect, it } from 'vitest';
import { entryProblem, MAX_ENTRIES } from '../shared/liveSchema';
import { liveChanges, setLiveChanges, showLocally, type ListItemChange } from '../src/data/live';
import {
  addedItems,
  boxLink,
  buildLists,
  carriedCategory,
  categoryChoices,
  cleanLinks,
  editItem,
  groupPoints,
  isPresetCategory,
  isTranslatedCategory,
  itemView,
  linkKey,
  MAX_ITEM_LISTS,
  listProgress,
  listSections,
  moveId,
  newItem,
  newList,
  orderWithGroup,
  oldGifts,
  reconcileOrder,
  oldTicks,
  POINTS_PER_ITEM,
  removeFrom,
  removeItem,
  removeList,
  renameList,
  reorderLists,
  setDone,
} from '../src/features/lists/lists';

const empty = { lists: {}, listItems: {} };
type Items = Record<string, ListItemChange>;
/** What the server does with a save: merges each entry's fields in (null removes it). */
const merged = (items: Items, entries: Record<string, ListItemChange | null>): Items => {
  const next = { ...items };
  for (const [key, data] of Object.entries(entries)) {
    if (data === null) delete next[key];
    else next[key] = { ...next[key], ...data };
  }
  return next;
};
const flightOf = (data: Parameters<typeof buildLists>[0]) =>
  buildLists(data, 'en').find((list) => list.id === 'flight')!;

describe('shared lists', () => {
  it('starts with the four lists and the 20 before-the-flight items', () => {
    const lists = buildLists(empty, 'he');
    expect(lists.map((list) => list.id)).toEqual(['flight', 'pack', 'gifts-dana', 'gifts-noa']);
    expect(lists[0].items).toHaveLength(20);
    expect(listProgress(lists[0])).toMatchObject({
      done: 0,
      total: 20,
      next: { id: 'flight.vjw' },
    });
    expect(lists[0].items[0].text).toBe('Visit Japan Web לשתינו');
  });

  it('ticks, edits and removes built-in items through their changes', () => {
    const vjw = flightOf(empty).items[0];
    const data = {
      lists: {},
      listItems: {
        ...setDone(vjw, 'flight', true),
        'flight.sushi': { removed: true },
      },
    };
    const sushi = flightOf(data).items[1];
    expect(sushi.id).toBe('flight.minamo');
    const edited = {
      ...data,
      listItems: merged(data.listItems, editItem(vjw, { text: 'VJW', note: 'QR' })),
    };
    const flight = flightOf(edited);
    expect(flight.items).toHaveLength(19);
    expect(flight.items[0]).toMatchObject({ text: 'VJW', note: 'QR', done: true });
    expect(listProgress(flight)).toMatchObject({ done: 1, next: { id: 'flight.minamo' } });
  });

  it('gives each group points for the items ticked in its lists', () => {
    const [vjw, second] = flightOf(empty).items;
    const lists = buildLists(
      {
        lists: {},
        listItems: { ...setDone(vjw, 'flight', true), ...setDone(second, 'flight', true) },
      },
      'en',
    );
    const owner = lists.find((list) => list.id === 'flight')!.owner;
    expect(groupPoints(lists, owner)).toBe(2 * POINTS_PER_ITEM);
    expect(groupPoints(buildLists(empty, 'en'), owner)).toBe(0);
  });

  it('adds our own lists and items, keeps them in order and deletes them', () => {
    const { id, change } = newList(empty, '  Kyoto shopping ', 'both');
    const first = newItem(id, { text: 'Kit Kat', note: '' });
    const [secondId, second] = Object.entries(newItem(id, { text: 'Matcha', note: 'for Mom' }))[0];
    const data = {
      lists: { [id]: change },
      listItems: { [secondId]: { ...second, done: true, at: Date.now() + 5 }, ...first },
    };
    const list = buildLists(data, 'en').at(-1)!;
    expect(list.name).toBe('Kyoto shopping');
    expect(list.items.map((item) => item.text)).toEqual(['Kit Kat', 'Matcha']);
    expect(addedItems(list).map((item) => item.done)).toEqual([false, true]);
    expect(removeItem(list.items[0])).toEqual({ [list.items[0].id]: null });
    const gone = { ...data, lists: { [id]: { ...change, ...removeList(id)[id] } } };
    expect(buildLists(gone, 'en').some((each) => each.id === id)).toBe(false);
  });

  it('renames a list, ours or one we start with', () => {
    const { id, change } = newList(empty, 'Kyoto', 'both');
    const data = {
      lists: {
        [id]: { ...change, ...renameList(id, ' Kyoto shopping ')[id] },
        ...renameList('pack', 'Suitcase'),
      },
      listItems: {},
    };
    const lists = buildLists(data, 'en');
    expect(lists.find((each) => each.id === id)?.name).toBe('Kyoto shopping');
    expect(lists.find((each) => each.id === 'pack')).toMatchObject({
      preset: 'pack',
      name: 'Suitcase',
    });
    expect(lists.map((each) => each.id).indexOf('pack')).toBe(1);
  });

  it('says whose each list is: the built-in gift lists ours each, the rest both, unless set', () => {
    const { id, change } = newList(empty, 'Shoes', 'noa');
    expect(change.owner).toBe('noa');
    const data = { lists: { [id]: change, pack: { owner: 'dana' as const } }, listItems: {} };
    expect(Object.fromEntries(buildLists(data, 'en').map((list) => [list.id, list.owner]))).toEqual(
      {
        flight: 'both',
        pack: 'dana',
        'gifts-dana': 'dana',
        'gifts-noa': 'noa',
        [id]: 'noa',
      },
    );
    expect(entryProblem('lists', id, change)).toBeNull();
    expect(entryProblem('lists', id, { owner: 'claude' })).toBe('bad owner');
  });

  it('reorders one group’s lists in their own places, the other groups’ staying put', () => {
    const all = ['flight', 'pack', 'gifts-dana', 'food', 'gifts-noa'];
    // Dana's lists are pack and gifts-dana; the others stay where they are.
    expect(orderWithGroup(all, ['gifts-dana', 'pack'])).toEqual([
      'flight',
      'gifts-dana',
      'pack',
      'food',
      'gifts-noa',
    ]);
    expect(orderWithGroup(all, [])).toEqual(all);
  });

  it('groups items by category, the list’s own first and no category last', () => {
    const at = Date.now();
    const item = (text: string, category: string, n: number) => ({
      [`item-${n}`]: {
        ...Object.values(newItem('pack', { text, note: '', category }))[0],
        at: at + n,
      },
    });
    const data = {
      lists: {},
      listItems: {
        ...item('Charger', 'electronics', 1),
        ...item('Onigiri', ' Snacks ', 2),
        ...item('Umbrella', '', 3),
        ...item('Socks', 'clothes', 4),
      },
    };
    const pack = buildLists(data, 'en').find((list) => list.id === 'pack')!;
    expect(listSections(pack).map((section) => section.category)).toEqual([
      'clothes',
      'electronics',
      'Snacks',
      '',
    ]);
    expect(categoryChoices(pack)).toEqual([
      'clothes',
      'toiletries',
      'electronics',
      'documents',
      'meds',
      'Snacks',
    ]);
    expect(isPresetCategory(pack, 'meds')).toBe(true);
    expect(isPresetCategory(pack, 'Snacks')).toBe(false);
    const umbrella = pack.items.find((each) => each.text === 'Umbrella')!;
    expect(editItem(umbrella, { text: 'Umbrella', note: '', category: 'clothes' })).toEqual({
      [umbrella.id]: { category: 'clothes' },
    });
    expect(Object.values(newItem('pack', { text: 'Hat', note: '' }))[0]).not.toHaveProperty(
      'category',
    );
  });

  it('puts our own before-the-flight items in its time groups, built-in ones first', () => {
    const [id, change] = Object.entries(
      newItem('flight', { text: 'Print bookings', note: '', category: 'week' }),
    )[0];
    const flight = flightOf({ lists: {}, listItems: { [id]: change } });
    const week = listSections(flight).find((section) => section.category === 'week')!;
    expect(week.items.at(-1)?.text).toBe('Print bookings');
    expect(week.items[0].id).toBe('flight.esim');
    expect(listSections(flight).map((section) => section.category)).toEqual([
      'now',
      'week',
      'dayBefore',
      'flightDay',
    ]);
    // A built-in item can move to another group.
    const esim = flight.items[0];
    const moved = merged(
      {},
      editItem(esim, { text: esim.text, note: esim.note, category: 'week' }),
    );
    expect(moved).toEqual({ [esim.id]: { category: 'week' } });
    const after = flightOf({ lists: {}, listItems: moved });
    expect(after.items.find((each) => each.id === esim.id)?.category).toBe('week');
  });

  it('puts ticked items at the bottom of their category', () => {
    const flight = flightOf({ lists: {}, listItems: { 'flight.vjw': { done: true } } });
    const now = listSections(flight).find((section) => section.category === 'now')!;
    expect(now.items.at(-1)?.id).toBe('flight.vjw');
    expect(now.items.slice(0, -1).every((each) => !each.done)).toBe(true);
  });

  it('moves an item to another list', () => {
    const [id, change] = Object.entries(
      newItem('pack', { text: 'Socks', note: '', category: 'clothes' }),
    )[0];
    const socks = buildLists({ lists: {}, listItems: { [id]: change } }, 'en')[1].items[0];
    expect(
      editItem(socks, { text: 'Socks', note: '', category: '', lists: ['gifts-dana'] }),
    ).toEqual({
      [id]: { category: '', list: 'gifts-dana' },
    });
    // A built-in item keeps its id, its tick and both languages.
    const items: Items = { 'flight.vjw': { done: true } };
    const vjw = flightOf({ lists: {}, listItems: items }).items[0];
    const entries = editItem(vjw, {
      text: vjw.text,
      note: vjw.note,
      category: '',
      lists: ['pack'],
    });
    expect(entries).toEqual({ [vjw.id]: { category: '', list: 'pack' } });
    const he = buildLists({ lists: {}, listItems: merged(items, entries) }, 'he');
    expect(he[0].items.some((each) => each.id === vjw.id)).toBe(false);
    expect(he[1].items[0]).toMatchObject({
      id: vjw.id,
      text: 'Visit Japan Web לשתינו',
      done: true,
    });
  });

  it('keeps a photo with an item, and with a built-in item that moves', () => {
    const [id, change] = Object.entries(
      newItem('pack', { text: 'Hat', note: '', category: '', photo: 'photo-1' }),
    )[0];
    const hat = buildLists({ lists: {}, listItems: { [id]: change } }, 'en')[1].items[0];
    expect(hat.photo).toBe('photo-1');
    expect(Object.values(newItem('pack', { text: 'Hat', note: '' }))[0]).not.toHaveProperty(
      'photo',
    );
    expect(editItem(hat, { text: 'Hat', note: '', category: '', photo: '' })).toEqual({
      [id]: { photo: '' },
    });
    expect(editItem(hat, { text: 'Hat', note: '' })).toEqual({});

    const vjw = flightOf(empty).items[0];
    expect(vjw.photo).toBe('');
    expect(
      editItem(vjw, {
        text: vjw.text,
        note: vjw.note,
        category: vjw.category,
        lists: ['pack'],
        photo: 'p-2',
      }),
    ).toEqual({
      [vjw.id]: { list: 'pack', category: '', photo: 'p-2' },
    });
  });

  it('shows one item in every list it is in, with a tick of its own in each', () => {
    const [id, change] = Object.entries(
      newItem('pack', { text: 'Umbrella', note: '', category: 'clothes' }),
    )[0];
    let items: Items = { [id]: change };
    const of = (listId: string) =>
      buildLists({ lists: {}, listItems: items }, 'en').find((list) => list.id === listId)!
        .items[0];
    items = merged(
      items,
      editItem(of('pack'), {
        text: 'Umbrella',
        note: '',
        category: 'clothes',
        lists: ['pack', 'gifts-noa'],
      }),
    );
    expect(items[linkKey('gifts-noa', id)]).toEqual({ of: id, list: 'gifts-noa', done: false });
    expect(of('pack')).toMatchObject({ lists: ['pack', 'gifts-noa'], done: false });
    expect(of('gifts-noa')).toMatchObject({ id, text: 'Umbrella', done: false });

    items = merged(items, setDone(of('gifts-noa'), 'gifts-noa', true));
    expect(of('pack').done).toBe(false);
    expect(of('gifts-noa').done).toBe(true);

    // One edit shows in both lists.
    items = merged(items, editItem(of('pack'), { text: 'Umbrella!', note: 'small' }));
    expect(of('gifts-noa')).toMatchObject({ text: 'Umbrella!', note: 'small', done: true });
  });

  it('keeps an item that is in several lists readable by apps from before links', () => {
    const [id, change] = Object.entries(newItem('pack', { text: 'Hat', note: '' }))[0];
    const hat = buildLists({ lists: {}, listItems: { [id]: change } }, 'en')[1].items[0];
    const items = merged(
      { [id]: change },
      editItem(hat, { text: 'Hat', note: '', category: '', lists: ['pack', 'gifts-dana'] }),
    );
    // The item's own entry keeps only fields every app knows; the link is an entry of its own.
    expect(Object.keys(items[id]).sort()).toEqual(['at', 'done', 'list', 'note', 'text']);
    const link = linkKey('gifts-dana', id);
    expect(entryProblem('listItems', link, items[link])).toBeNull();
  });

  it('adds and takes away lists, keeping each list’s tick and its own list while picked', () => {
    const [id, change] = Object.entries(newItem('pack', { text: 'Hat', note: '' }))[0];
    let items: Items = { [id]: { ...change, done: true } };
    const hat = () => buildLists({ lists: {}, listItems: items }, 'en')[1].items[0];
    expect(
      editItem(hat(), { text: 'Hat', note: '', category: '', lists: ['pack', 'gifts-dana'] }),
    ).toEqual({
      [linkKey('gifts-dana', id)]: { of: id, list: 'gifts-dana', done: false },
    });
    items = merged(
      items,
      editItem(hat(), { text: 'Hat', note: '', category: '', lists: ['pack', 'gifts-dana'] }),
    );
    // Without its own list, the next one picked becomes its own, with that list's tick.
    expect(editItem(hat(), { text: 'Hat', note: '', category: '', lists: ['gifts-dana'] })).toEqual(
      {
        [linkKey('gifts-dana', id)]: null,
        [id]: { list: 'gifts-dana', done: false },
      },
    );
    // No list at all changes nothing.
    expect(editItem(hat(), { text: 'Hat!', note: '', category: '', lists: [] })).toEqual({});
  });

  it('takes an item out of one list only, and deletes it from its last', () => {
    const [id, change] = Object.entries(newItem('pack', { text: 'Hat', note: '' }))[0];
    const items: Items = {
      [id]: change,
      [linkKey('gifts-dana', id)]: { of: id, list: 'gifts-dana', done: true },
    };
    const hat = buildLists({ lists: {}, listItems: items }, 'en')[1].items[0];
    expect(removeFrom(hat, 'pack')).toEqual({
      [linkKey('gifts-dana', id)]: null,
      [id]: { list: 'gifts-dana', done: true },
    });
    const left = buildLists({ lists: {}, listItems: merged(items, removeFrom(hat, 'pack')) }, 'en');
    expect(left[1].items).toEqual([]);
    expect(left[2].items[0]).toMatchObject({ id, done: true, lists: ['gifts-dana'] });
    expect(removeFrom(left[2].items[0], 'gifts-dana')).toEqual({ [id]: null });
    // Taken out of a linked list, only that link goes.
    expect(removeFrom(hat, 'gifts-dana')).toEqual({ [linkKey('gifts-dana', id)]: null });
  });

  it('takes a built-in item out of either of its lists, keeping its id', () => {
    const vjw = flightOf(empty).items[0];
    const linked = merged(
      {},
      editItem(vjw, {
        text: vjw.text,
        note: vjw.note,
        category: vjw.category,
        lists: ['flight', 'pack'],
      }),
    );
    const both = flightOf({ lists: {}, listItems: linked }).items[0];
    // From before-the-flight: the other list becomes its own.
    expect(removeFrom(both, 'flight')).toEqual({
      [linkKey('pack', vjw.id)]: null,
      [vjw.id]: { list: 'pack', category: '' },
    });
    // From the other list: only the link goes.
    expect(removeFrom(both, 'pack')).toEqual({ [linkKey('pack', vjw.id)]: null });
    // From its last list it is hidden, with its links.
    expect(removeItem(both)).toEqual({
      [linkKey('pack', vjw.id)]: null,
      [vjw.id]: { removed: true },
    });
  });

  it('shows a built-in item in its other lists even without before-the-flight', () => {
    const vjw = flightOf(empty).items[0];
    const items = merged(
      {},
      editItem(vjw, {
        text: vjw.text,
        note: vjw.note,
        category: vjw.category,
        lists: ['flight', 'pack'],
      }),
    );
    const lists = buildLists({ lists: { flight: { removed: true } }, listItems: items }, 'en');
    expect(lists[0].id).toBe('pack');
    expect(lists[0].items[0]).toMatchObject({ id: vjw.id, lists: ['pack'] });
  });

  it('keeps ticks in different lists apart, so two phones ticking at once lose nothing', () => {
    const [id, change] = Object.entries(newItem('pack', { text: 'Hat', note: '' }))[0];
    const before: Items = {
      [id]: change,
      [linkKey('gifts-dana', id)]: { of: id, list: 'gifts-dana' },
      [linkKey('gifts-noa', id)]: { of: id, list: 'gifts-noa' },
    };
    const hatIn = (items: Items, listId: string) =>
      buildLists({ lists: {}, listItems: items }, 'en')
        .find((list) => list.id === listId)!
        .items.find((each) => each.id === id)!;
    // Each phone ticks from the same copy; the server merges both saves.
    const a = setDone(hatIn(before, 'gifts-dana'), 'gifts-dana', true);
    const b = setDone(hatIn(before, 'gifts-noa'), 'gifts-noa', true);
    const after = merged(merged(before, a), b);
    expect(hatIn(after, 'gifts-dana').done).toBe(true);
    expect(hatIn(after, 'gifts-noa').done).toBe(true);
    expect(hatIn(after, 'pack').done).toBe(false);
    // Changing its lists writes only the links that change, so another list's tick stays.
    expect(
      editItem(hatIn(before, 'pack'), {
        text: 'Hat',
        note: '',
        category: '',
        lists: ['pack', 'gifts-dana'],
      }),
    ).toEqual({
      [linkKey('gifts-noa', id)]: null,
    });
    // Deleting it clears its links too.
    expect(removeItem(hatIn(after, 'pack'))).toEqual({
      [linkKey('gifts-dana', id)]: null,
      [linkKey('gifts-noa', id)]: null,
      [id]: null,
    });
    expect(linkKey('gifts-dana', 'item-old-' + 'x'.repeat(80)).length).toBeLessThanOrEqual(80);
  });

  it('leaves out lists that were removed, and clears their links with the next edit', () => {
    const [id, change] = Object.entries(newItem('list-gone', { text: 'Tea', note: '' }))[0];
    const items: Items = {
      [id]: change,
      [linkKey('pack', id)]: { of: id, list: 'pack' },
      [linkKey('list-old', id)]: { of: id, list: 'list-old', done: true },
    };
    const tea = buildLists({ lists: {}, listItems: items }, 'en')[1].items[0];
    expect(tea).toMatchObject({ id, home: 'list-gone', lists: ['pack'], goneLinks: ['list-old'] });
    // Its own list is gone too, so the list it is still in becomes its own.
    expect(editItem(tea, { text: 'Green tea', note: '' })).toEqual({
      [linkKey('pack', id)]: null,
      [linkKey('list-old', id)]: null,
      [id]: { text: 'Green tea', list: 'pack' },
    });
  });

  it('keeps every edit of an item in the most lists within one save', () => {
    const made = ['list-1', 'list-2', 'list-3', 'list-4', 'list-5', 'list-6'];
    const lists = Object.fromEntries(made.map((id) => [id, { name: id }]));
    const [id, change] = Object.entries(newItem('pack', { text: 'Hat', note: '' }))[0];
    const links = ['flight', 'gifts-dana', 'gifts-noa', 'list-6'];
    expect(links.length + 1).toBe(MAX_ITEM_LISTS);
    const items: Items = { [id]: change };
    for (const list of [...links, ...Array.from({ length: 20 }, (_, n) => `list-gone-${n}`)]) {
      items[linkKey(list, id)] = { of: id, list };
    }
    const hat = buildLists({ lists, listItems: items }, 'en')[1].items[0];
    expect(hat.goneLinks).toHaveLength(20);
    // Into as many other lists, with room left for a new list saved with it.
    const moved = editItem(hat, {
      text: 'Hat',
      note: '',
      category: '',
      lists: made.slice(0, MAX_ITEM_LISTS),
    });
    expect(Object.keys(moved).length).toBeLessThanOrEqual(MAX_ENTRIES - 1);
    expect(moved[id]).toMatchObject({ list: 'list-1' });
    // Deleting it clears what fits; the other gone links wait for a later save.
    const removed = removeItem(hat);
    expect(Object.keys(removed)).toHaveLength(MAX_ENTRIES);
    expect(removed[id]).toBeNull();
  });

  it('clears a list’s key once the item has left every list that owns it', () => {
    const vjw = flightOf(empty).items[0];
    const linked = merged(
      {},
      editItem(vjw, {
        text: vjw.text,
        note: vjw.note,
        category: vjw.category,
        lists: ['flight', 'pack'],
      }),
    );
    const both = flightOf({ lists: {}, listItems: linked }).items[0];
    expect(both.category).toBe('now');
    expect(removeFrom(both, 'flight')).toEqual({
      [linkKey('pack', vjw.id)]: null,
      [vjw.id]: { list: 'pack', category: '' },
    });
    // Still in a list that owns it, or typed words: kept.
    expect(removeFrom(both, 'pack')).toEqual({ [linkKey('pack', vjw.id)]: null });
    const [id, change] = Object.entries(
      newItem('pack', { text: 'Hat', note: '', category: 'Winter' }),
    )[0];
    const hat = buildLists({ lists: {}, listItems: { [id]: change } }, 'en')[1].items[0];
    expect(
      editItem(hat, { text: 'Hat', note: '', category: 'Winter', lists: ['gifts-dana'] }),
    ).toEqual({
      [id]: { list: 'gifts-dana' },
    });
  });

  it('puts a built-in item back in before-the-flight when the list it moved to is gone', () => {
    const vjw = flightOf(empty).items[0];
    const items = { [vjw.id]: { list: 'list-gone' } };
    const lists = { 'list-gone': { removed: true } };
    expect(flightOf({ lists, listItems: items }).items[0]).toMatchObject({ id: vjw.id });
  });

  it('refuses a tick that would leave a link without its item', () => {
    expect(entryProblem('listItems', linkKey('pack', 'item-1'), { done: true })).not.toBeNull();
    expect(entryProblem('listItems', 'flight.vjw', { done: true })).toBeNull();
  });

  it('translates a key brought along from another list, not the same words typed', () => {
    const [id, change] = Object.entries(
      newItem('pack', { text: 'Socks', note: '', category: 'clothes' }),
    )[0];
    const [typedId, typed] = Object.entries(
      newItem('gifts-dana', { text: 'Scarf', note: '', category: 'clothes' }),
    )[0];
    const socks = buildLists({ lists: {}, listItems: { [id]: change } }, 'en')[1].items[0];
    const linked = merged(
      { [id]: change, [typedId]: typed },
      editItem(socks, {
        text: 'Socks',
        note: '',
        category: 'clothes',
        lists: ['pack', 'gifts-noa'],
      }),
    );
    const lists = buildLists({ lists: {}, listItems: linked }, 'en');
    expect(isTranslatedCategory(lists[1], 'clothes')).toBe(true);
    expect(isTranslatedCategory(lists[3], 'clothes')).toBe(true);
    expect(isTranslatedCategory(lists[2], 'clothes')).toBe(false);
  });

  it('moves a phone’s old ticks and gifts into the shared lists', () => {
    const ticks = oldTicks({ lists: {}, listItems: { 'flight.qr': { done: true } } }, [
      'vjw',
      'qr',
      'gone',
    ]);
    expect(ticks).toEqual({ 'flight.vjw': { done: true } });
    // A built-in item moved to another list ticks before-the-flight through its link, if any.
    const away = { 'flight.vjw': { list: 'pack' }, 'flight.qr': { list: 'pack' } };
    const link = linkKey('flight', 'flight.vjw');
    const links = { ...away, [link]: { of: 'flight.vjw', list: 'flight' } };
    expect(oldTicks({ lists: {}, listItems: links }, ['vjw', 'qr'])).toEqual({
      [link]: { done: true },
    });
    const gifts = Object.values(
      oldGifts(empty, 'gifts-dana', [{ id: 'g1', for: 'Mom', what: 'Tea', bought: true }]),
    );
    expect(gifts[0]).toMatchObject({ list: 'gifts-dana', text: 'Tea', note: 'Mom', done: true });
    const moved = { lists: {}, listItems: { 'item-old-g1': { list: 'gifts-dana' } } };
    expect(
      oldGifts(moved, 'gifts-dana', [{ id: 'g1', for: '', what: 'Tea', bought: false }]),
    ).toEqual({});
  });

  it('saves only what changed, so a note edit keeps the text in both languages', () => {
    const vjw = flightOf(empty).items[0];
    expect(editItem(vjw, { text: vjw.text, note: 'QR' })).toEqual({ 'flight.vjw': { note: 'QR' } });
    expect(editItem(vjw, { text: vjw.text, note: vjw.note })).toEqual({});
    expect(removeItem(vjw)).toEqual({ 'flight.vjw': { removed: true } });
  });

  it('putting back a failed save leaves a later tap alone', () => {
    const first = showLocally('listItems', { 'test.one': { done: true } });
    const second = showLocally('listItems', {
      'test.one': { done: false },
      'test.two': { done: true },
    });
    first.putBack();
    expect(liveChanges().listItems['test.one']).toEqual({ done: false });
    expect(liveChanges().listItems['test.two']).toEqual({ done: true });
    second.putBack();
  });

  it('shows a change at once and puts it back when saving fails', () => {
    const before = liveChanges();
    const { putBack } = showLocally('listItems', { 'test.one': { done: true } });
    expect(liveChanges().listItems['test.one']).toEqual({ done: true });
    putBack();
    expect(liveChanges().listItems).toEqual(before.listItems);
  });

  it('keeps a change on top of an older copy from the server until a copy has it', () => {
    const before = liveChanges();
    const shown = showLocally('listItems', { 'test.one': { done: true } });
    shown.saved(before.version + 2);
    setLiveChanges({ ...before, version: before.version + 1 });
    expect(liveChanges().listItems['test.one']).toEqual({ done: true });
    setLiveChanges({ ...before, version: before.version + 2 });
    expect(liveChanges().listItems).toEqual(before.listItems);
  });

  it('reads a saved copy from before the lists existed', () => {
    const old: Record<string, unknown> = { ...liveChanges() };
    delete old.lists;
    delete old.listItems;
    expect(setLiveChanges({ ...old, version: 999 })).toBe(true);
    expect(liveChanges().lists).toEqual({});
    setLiveChanges({ ...old, version: -1 });
  });

  it('reorders the lists, saving only the places that changed', () => {
    const data = { lists: { 'list-food': { name: 'Food', order: 4 } }, listItems: {} };
    const ids = buildLists(data, 'en').map((list) => list.id);
    const order = moveId(ids, 4, 0);
    expect(order).toEqual(['list-food', 'flight', 'pack', 'gifts-dana', 'gifts-noa']);
    const changes = reorderLists(data, order);
    expect(changes['list-food']).toEqual({ order: 0 });
    const reordered = { ...data, lists: { ...data.lists, ...changes } };
    expect(buildLists(reordered, 'en').map((list) => list.id)).toEqual(order);
    // Saved again in the same order, nothing has to change.
    expect(reorderLists(reordered, order)).toEqual({});
  });

  it('writes no place for a built-in list that has not moved', () => {
    const data = { lists: {}, listItems: {} };
    const ids = buildLists(data, 'en').map((list) => list.id);
    expect(reorderLists(data, ids)).toEqual({});
    expect(Object.keys(reorderLists(data, moveId(ids, 1, 0)))).toEqual([ids[1], ids[0]]);
  });

  it('also places an unmoved list whose saved place is past its spot, so the order holds', () => {
    // Food and Sake were saved at 9 and 10 when there were more lists, past where they sit now.
    const data = {
      lists: { 'list-food': { name: 'Food', order: 9 }, 'list-sake': { name: 'Sake', order: 10 } },
      listItems: {},
    };
    const ids = buildLists(data, 'en').map((list) => list.id);
    const order = moveId(ids, ids.indexOf('list-sake'), 2);
    const reordered = { ...data, lists: { ...data.lists, ...reorderLists(data, order) } };
    expect(buildLists(reordered, 'en').map((list) => list.id)).toEqual(order);
  });

  it('keeps a dragged order when lists came or went meanwhile', () => {
    expect(reconcileOrder(['c', 'a', 'b'], ['a', 'b', 'd'])).toEqual(['a', 'b', 'd']);
    expect(reconcileOrder(['b', 'a'], ['a', 'b', 'd'])).toEqual(['b', 'a', 'd']);
  });

  it("keeps a typed category in another list, but not one of the old list's own", () => {
    const [flight, pack] = buildLists(empty, 'en');
    expect(carriedCategory(flight, pack, 'now')).toBe('');
    expect(carriedCategory(flight, pack, 'Kyoto')).toBe('Kyoto');
    expect(carriedCategory(pack, pack, 'clothes')).toBe('clothes');
  });
});

describe('links in items', () => {
  const shop =
    'https://www.discovery-japan.me/category/select/pid/459/language/en/currency/JPY?category=watch';
  const pasted = `${shop}&saf_src=google_x&saf_kw=&account_id=8782428042&gad_source=1&gbraid=0AAAA&gclid=Cj0KCQjw`;

  it('takes the tracking parts out of a pasted link, keeping the rest and what was typed around it', () => {
    expect(cleanLinks(`שעון ${pasted}.`)).toBe(`שעון ${shop}.`);
    expect(cleanLinks('https://example.com/a?id=3')).toBe('https://example.com/a?id=3');
    expect(cleanLinks('no link here')).toBe('no link here');
  });

  it('keeps a bracket that belongs to the link, dropping one typed around it', () => {
    const wiki = 'https://en.wikipedia.org/wiki/Mito_(city)';
    expect(cleanLinks(`(${wiki}).`)).toBe(`(${wiki}).`);
    expect(itemView({ text: `מיטו ${wiki}`, note: '' }).link).toBe(wiki);
    expect(itemView({ text: `מיטו (${wiki})`, note: '' }).link).toBe(wiki);
  });

  it('leaves the rest of the address exactly as typed when taking tracking out', () => {
    expect(cleanLinks('https://s.jp/a?q=a%20b,c&k=1:2&utm_source=g#top')).toBe(
      'https://s.jp/a?q=a%20b,c&k=1:2#top',
    );
    expect(cleanLinks('https://s.jp/a?flag&gclid=1')).toBe('https://s.jp/a?flag');
    expect(cleanLinks('https://s.jp/a?gclid=1')).toBe('https://s.jp/a');
  });

  it('takes out the account only from a Google Shopping ad link', () => {
    expect(cleanLinks('https://s.jp/book?account_id=7')).toBe('https://s.jp/book?account_id=7');
    expect(cleanLinks('https://s.jp/a?id=1&saf_src=g&account_id=7')).toBe('https://s.jp/a?id=1');
  });

  it('ends the link at Hebrew words, direction marks and Japanese punctuation', () => {
    expect(itemView({ text: 'https://s.jp/aלקנות', note: '' }).link).toBe('https://s.jp/a');
    expect(itemView({ text: 'https://s.jp/a、次', note: '' }).link).toBe('https://s.jp/a');
    expect(itemView({ text: 'שעון https://s.jp/a‏', note: '' }).link).toBe('https://s.jp/a');
  });

  it('keeps the line breaks of a note the link is taken out of', () => {
    expect(itemView({ text: 'שעון', note: 'זאב\nכחול https://s.jp/a' }).note).toBe('זאב\nכחול');
  });

  it('saves a pasted shop link short enough to fit', () => {
    const [entry] = Object.values(newItem('gifts-noa', { text: `שעון ${pasted}`, note: 'זאב' }));
    expect(entry.text).toBe(`שעון ${shop}`);
    expect(entryProblem('listItems', 'item-x', entry)).toBeNull();
  });

  it('cleans a link added in an edit', () => {
    const [item] = buildLists(
      { lists: {}, listItems: { 'item-1': { list: 'gifts-noa', text: 'שעון', note: 'זאב' } } },
      'he',
    ).find((list) => list.id === 'gifts-noa')!.items;
    expect(editItem(item, { text: 'שעון', note: `זאב ${pasted}` })).toEqual({
      'item-1': { note: `זאב ${shop}` },
    });
  });

  it('changes nothing but the category when only the category is edited', () => {
    const [item] = buildLists(
      {
        lists: {},
        listItems: { 'item-1': { list: 'gifts-noa', text: 'שעון', note: `זאב ${shop}` } },
      },
      'he',
    ).find((list) => list.id === 'gifts-noa')!.items;
    expect(editItem(item, { text: item.text, note: item.note, category: 'family' })).toEqual({
      'item-1': { category: 'family' },
    });
  });

  it('shows the link as its own button, out of the words', () => {
    expect(itemView({ text: `שעון ${shop}`, note: 'זאב' })).toEqual({
      text: 'שעון',
      note: 'זאב',
      link: shop,
    });
    expect(itemView({ text: 'שעון', note: `זאב ${shop}` })).toEqual({
      text: 'שעון',
      note: 'זאב',
      link: shop,
    });
    expect(itemView({ text: shop, note: '' })).toMatchObject({ text: 'discovery-japan.me' });
    expect(itemView({ text: 'שעון', note: 'זאב' })).toEqual({
      text: 'שעון',
      note: 'זאב',
      link: '',
    });
  });
});

describe("an item's link box", () => {
  const added = (fields: Parameters<typeof newItem>[1]) => {
    const [id, change] = Object.entries(newItem('pack', fields))[0];
    const item = buildLists({ lists: {}, listItems: { [id]: change } }, 'he')
      .find((list) => list.id === 'pack')!
      .items.find((each) => each.id === id)!;
    return { id, change, item };
  };

  it('keeps a typed address cleaned, adds https:// when left out, and drops what is not one', () => {
    expect(boxLink(' https://shop.jp/w?id=7&utm_source=ad ')).toBe('https://shop.jp/w?id=7');
    expect(boxLink('shop.jp/w')).toBe('https://shop.jp/w');
    expect(boxLink('שעון כחול')).toBe('');
    expect(boxLink('')).toBe('');
  });

  it('saves the link with a new item, and nothing when there is none', () => {
    const { change, item } = added({ text: 'שעון', link: 'https://shop.jp/w?gclid=1' });
    expect(change.link).toBe('https://shop.jp/w');
    expect(entryProblem('listItems', 'item-x', change)).toBeNull();
    expect(itemView(item)).toEqual({ text: 'שעון', note: '', link: 'https://shop.jp/w' });
    expect(added({ text: 'כובע' }).change).not.toHaveProperty('link');
  });

  it('changes or clears the link in an edit, and saves nothing when it is the same', () => {
    const { id, item } = added({ text: 'שעון', link: 'https://shop.jp/w' });
    expect(editItem(item, { link: 'https://shop.jp/b' })).toEqual({
      [id]: { link: 'https://shop.jp/b' },
    });
    expect(editItem(item, { link: '' })).toEqual({ [id]: { link: '' } });
    expect(editItem(item, { link: 'https://shop.jp/w' })).toEqual({});
  });

  it('keeps the link when the box holds words that are not an address', () => {
    const { item } = added({ text: 'שעון', link: 'https://shop.jp/w' });
    expect(editItem(item, { link: 'שעון כחול' })).toEqual({});
    expect(editItem(item, { link: '  ' })).toEqual({ [item.id]: { link: '' } });
  });

  it('lets the server refuse a link that is not a web address', () => {
    expect(entryProblem('listItems', 'item-x', { link: 'javascript:alert(1)' })).not.toBeNull();
    expect(entryProblem('listItems', 'item-x', { link: '' })).toBeNull();
  });
});
