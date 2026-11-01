// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SheetContext, type SheetContent } from '../src/app/sheetContext';
import { ToastContext } from '../src/app/toastContext';
import { setLiveChanges, type LiveChanges } from '../src/data/live';
import seed from '../src/data/live-seed.json';
import lists from './fixtures/lists-seed.json';
import { linkKey, MAX_ITEM_LISTS } from '../src/features/lists/lists';
import { ListsPage } from '../src/features/lists/ListsPage';
import i18n from '../src/i18n';

const CODE = '246810';
const ITEM = 'item-pack-passports';
// The lists as these tests were written for, not whatever is live now.
const base = { ...seed, ...lists } as LiveChanges;

type Kind = 'lists' | 'listItems';
type Entry = { kind: Kind; key: string; data: Record<string, unknown> | null; merge?: boolean };

/** A tiny copy of worker/index.ts for list saves: one code, a version, all of a save or none. */
function fakeServer() {
  const state: LiveChanges = structuredClone({ ...base, version: base.version + 100 });
  const saves: Entry[][] = [];
  // `failures`: how many of the next saves with an item in them the server refuses;
  // `listFailures`: the same for saves of lists alone.
  const server = { state, saves, failures: 0, listFailures: 0 };
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const path = new URL(input).pathname.replace(/^\/api/, '');
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
    if (path === '/changes') return reply(state);
    const auth = (init.headers as Record<string, string>).Authorization;
    if (auth !== `Bearer ${CODE}`) return reply({ error: 'wrong code' }, 401);
    if (path === '/me') return reply({ who: 'dana' });
    if (path === '/change') {
      const entries: Entry[] = body.changes ?? [body];
      if (server.failures > 0 && entries.some((entry) => entry.kind === 'listItems')) {
        server.failures -= 1;
        return reply({ error: 'boom' }, 500);
      }
      if (server.listFailures > 0 && entries.every((entry) => entry.kind === 'lists')) {
        server.listFailures -= 1;
        return reply({ error: 'boom' }, 500);
      }
      saves.push(entries);
      for (const { kind, key, data, merge } of entries) {
        const table = state[kind] as Record<string, unknown>;
        if (!data) delete table[key];
        else table[key] = merge ? { ...(table[key] as object), ...data } : data;
      }
      state.version += 1;
      return reply({ version: state.version });
    }
    return reply({ error: 'not found' }, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return server;
}

function renderLists() {
  const toasts: string[] = [];
  const api = {
    current: null,
    open: (content: SheetContent) => void content,
    close: () => undefined,
  };
  render(
    <SheetContext.Provider value={api}>
      <ToastContext.Provider value={(message) => toasts.push(message)}>
        <ListsPage listId="pack" />
      </ToastContext.Provider>
    </SheetContext.Provider>,
  );
  return { toasts };
}

const textOf = () => base.listItems[ITEM]!.text as string;
const openEdit = () =>
  fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.edit', { name: textOf() }) }));
const itemField = () => screen.getByRole('textbox', { name: i18n.t('lists.item') });
const listChips = () => within(screen.getByRole('group', { name: i18n.t('lists.list') }));
const saveButton = () => screen.getByRole('button', { name: i18n.t('lists.save') });
/** Taps a list in the edit form: adds it, or takes it away when it is picked. */
const tapList = (name: string) => fireEvent.click(listChips().getByRole('button', { name }));
const PACK = i18n.t('lists.presets.pack');

/** Picks "+ New" in the edit form's lists and names the new list. */
function newListNamed(name: string) {
  fireEvent.click(listChips().getByRole('button', { name: i18n.t('lists.newCategory') }));
  const input = screen.getByRole('textbox', { name: i18n.t('lists.newList') });
  fireEvent.change(input, { target: { value: name } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

/** Lists the server has that the seed didn't. */
const madeLists = (state: LiveChanges) =>
  Object.keys(state.lists).filter((id) => !(id in base.lists));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('japan-together.liveCode', JSON.stringify(CODE));
  localStorage.setItem('japan-together.liveWho', JSON.stringify('dana'));
  // One newer than the bundled seed, so it replaces the lists that are live now.
  setLiveChanges(structuredClone({ ...base, version: base.version + 1 }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setLiveChanges({ ...base, version: -1 });
});

describe('editing a list item in place', () => {
  it('moves an item to a new list, saving the list and the item in one go', async () => {
    const server = fakeServer();
    renderLists();
    openEdit();
    newListNamed('קיוטו');
    tapList(PACK);
    fireEvent.click(saveButton());

    await waitFor(() => expect(server.saves).toHaveLength(1));
    const [made] = madeLists(server.state);
    expect(server.state.lists[made]).toMatchObject({ name: 'קיוטו' });
    expect(server.state.listItems[ITEM]).toMatchObject({ list: made });
    expect(server.saves[0].map((entry) => entry.kind).sort()).toEqual(['listItems', 'lists']);
    await waitFor(() => expect(screen.queryByText(textOf())).toBeNull());
  });

  it('opens the edit again with what was typed when a move to another list fails', async () => {
    const server = fakeServer();
    server.failures = 1;
    const { toasts } = renderLists();
    openEdit();
    fireEvent.change(itemField(), { target: { value: 'דרכונים ותעודות' } });
    tapList('אוכל');
    tapList(PACK);
    fireEvent.click(saveButton());

    await waitFor(() => expect(toasts).toEqual([i18n.t('live.errors.failed')]));
    expect(itemField()).toHaveProperty('value', 'דרכונים ותעודות');
    expect(listChips().getByRole('button', { name: 'אוכל' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(server.saves).toHaveLength(0);
    expect(server.state.listItems[ITEM]).toMatchObject({ list: 'pack' });
  });

  it('makes exactly one list when a move to a new list fails and is sent again', async () => {
    const server = fakeServer();
    server.failures = 1;
    const { toasts } = renderLists();
    openEdit();
    newListNamed('קיוטו');
    tapList(PACK);
    fireEvent.click(saveButton());

    await waitFor(() => expect(toasts).toEqual([i18n.t('live.errors.failed')]));
    // No empty list was left behind, and the form still has the new list's name.
    expect(madeLists(server.state)).toEqual([]);
    expect(listChips().getByRole('button', { name: 'קיוטו' }).getAttribute('aria-pressed')).toBe(
      'true',
    );

    fireEvent.click(saveButton());
    await waitFor(() => expect(server.saves).toHaveLength(1));
    const made = madeLists(server.state);
    expect(made).toHaveLength(1);
    expect(server.state.listItems[ITEM]).toMatchObject({ list: made[0] });
  });
});

describe('an item card', () => {
  it('opens the edit when tapped, and only the circle ticks it', async () => {
    const server = fakeServer();
    renderLists();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${textOf()}`) }));
    expect(itemField()).toHaveProperty('value', textOf());
    expect(server.saves).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.cancel') }));
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('lists.doneToggle', { name: textOf() }) }),
    );
    await waitFor(() => expect(server.state.listItems[ITEM]).toMatchObject({ done: true }));
  });

  it('moves a ticked item below its category’s "✓ done" toggle, which folds it away and back', async () => {
    const server = fakeServer();
    renderLists();
    const card = () => screen.queryByRole('button', { name: new RegExp(`^${textOf()}`) });
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('lists.doneToggle', { name: textOf() }) }),
    );
    await waitFor(() => expect(server.state.listItems[ITEM]).toMatchObject({ done: true }));

    const toggle = screen.getByRole('button', {
      name: new RegExp(i18n.t('lists.doneCount', { count: 1 })),
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.compareDocumentPosition(card()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(card()).toBeNull();

    fireEvent.click(toggle);
    expect(card()).not.toBeNull();
  });

  it('opens a link pasted in the note from its pill, and the edit moves it to the link box', async () => {
    const shop = 'https://example.com/watch';
    const server = fakeServer();
    server.state.listItems[ITEM] = { ...base.listItems[ITEM], note: `זאב ${shop}?gclid=abc` };
    setLiveChanges(structuredClone(server.state));
    renderLists();
    const link = screen.getByRole('link', {
      name: i18n.t('lists.openLink', { name: textOf() }),
    });
    expect(link).toHaveProperty('href', shop);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(screen.queryByText(`זאב ${shop}?gclid=abc`)).toBeNull();

    openEdit();
    expect(screen.getByRole('textbox', { name: i18n.t('lists.note') })).toHaveProperty(
      'value',
      'זאב',
    );
    expect(screen.getByRole('textbox', { name: i18n.t('lists.link') })).toHaveProperty(
      'value',
      shop,
    );
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(server.state.listItems[ITEM]).toMatchObject({ note: 'זאב', link: shop }),
    );
  });

  it('keeps the link box open while its address is cleared to type another', async () => {
    const server = fakeServer();
    server.state.listItems[ITEM] = { ...base.listItems[ITEM], link: 'https://shop.jp/w' };
    setLiveChanges(structuredClone(server.state));
    renderLists();
    openEdit();
    const box = () => screen.getByRole('textbox', { name: i18n.t('lists.link') });
    fireEvent.change(box(), { target: { value: '' } });
    expect(screen.queryByRole('button', { name: i18n.t('lists.addLink') })).toBeNull();
    fireEvent.change(box(), { target: { value: 'shop.jp/b' } });
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(server.state.listItems[ITEM]).toMatchObject({ link: 'https://shop.jp/b' }),
    );
  });

  it('adds a link from its own box, and takes it off again', async () => {
    const server = fakeServer();
    renderLists();
    openEdit();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.addLink') }));
    const box = screen.getByRole('textbox', { name: i18n.t('lists.link') });
    expect(document.activeElement).toBe(box);
    const openButton = () =>
      screen.queryByRole('link', { name: i18n.t('lists.openTypedLink') }) as HTMLAnchorElement;
    fireEvent.change(box, { target: { value: 'a shop' } });
    expect(openButton()).toBeNull();
    fireEvent.change(box, { target: { value: 'shop.jp/w' } });
    expect(openButton().href).toBe('https://shop.jp/w');
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(server.state.listItems[ITEM]).toMatchObject({ link: 'https://shop.jp/w' }),
    );

    openEdit();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.removeLink') }));
    expect(screen.queryByRole('textbox', { name: i18n.t('lists.link') })).toBeNull();
    fireEvent.click(saveButton());
    await waitFor(() => expect(server.state.listItems[ITEM]).toMatchObject({ link: '' }));
  });

  it('takes the category off from its "Other" chip', async () => {
    const server = fakeServer();
    server.state.listItems[ITEM] = { ...base.listItems[ITEM], category: 'documents' };
    setLiveChanges(structuredClone(server.state));
    renderLists();
    openEdit();
    const categories = within(screen.getByRole('group', { name: i18n.t('lists.category') }));
    const other = categories.getByRole('button', { name: i18n.t('lists.noCategory') });
    expect(other.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(other);
    expect(other.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(saveButton());
    await waitFor(() => expect(server.state.listItems[ITEM]).toMatchObject({ category: '' }));
  });
});

describe("a group's points", () => {
  it('bumps the sticker and floats the points on every tick, without React key warnings', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const server = fakeServer();
    renderLists();
    const tick = () =>
      fireEvent.click(
        screen.getByRole('button', { name: i18n.t('lists.doneToggle', { name: textOf() }) }),
      );
    const pop = () => document.querySelector('.list-group-pop');

    tick();
    await waitFor(() => expect(pop()).not.toBeNull());
    expect(document.querySelector('.list-group-points.is-popping')).not.toBeNull();
    const first = pop();

    // Untick it from under "✓ done" (shown by default), then tick it again: a fresh "+N" (a new
    // element) replays the float.
    tick();
    await waitFor(() => expect(server.state.listItems[ITEM]).toMatchObject({ done: false }));
    tick();
    await waitFor(() => expect(server.state.listItems[ITEM]).toMatchObject({ done: true }));
    await waitFor(() => expect(pop()).not.toBe(first));

    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});

describe('an item in several lists', () => {
  it('adds the same item to another list, and says so on its card and in the edit', async () => {
    const server = fakeServer();
    renderLists();
    openEdit();
    expect(screen.queryByText(i18n.t('lists.linkedNote'))).toBeNull();
    tapList('אוכל');
    expect(screen.getByText(i18n.t('lists.linkedNote'))).toBeTruthy();
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(server.state.listItems[linkKey('list-food', ITEM)]).toMatchObject({
        of: ITEM,
        list: 'list-food',
      }),
    );
    expect(server.state.listItems[ITEM]).toMatchObject({ list: 'pack' });
    // Still one item, not a copy.
    const sameText = Object.values(server.state.listItems).filter((item) => item.text === textOf());
    expect(sameText).toHaveLength(1);
    expect(screen.getByText('גם ב: אוכל', { selector: '.list-linked' })).toBeTruthy();
  });

  it('says so and adds no more lists once the item is in as many as one save holds', () => {
    fakeServer();
    const { toasts } = renderLists();
    openEdit();
    for (const name of [
      i18n.t('lists.presets.flight'),
      // The two gift lists say whose they are, where all the lists are side by side.
      `${i18n.t('lists.presets.giftsDana')} · ${i18n.t('lists.groups.dana')}`,
      `${i18n.t('lists.presets.giftsNoa')} · ${i18n.t('lists.groups.noa')}`,
      'אוכל',
    ]) {
      tapList(name);
    }
    expect(toasts).toEqual([]);
    fireEvent.click(listChips().getByRole('button', { name: i18n.t('lists.newCategory') }));
    expect(toasts).toEqual([i18n.t('lists.tooManyLists', { count: MAX_ITEM_LISTS })]);
    expect(screen.queryByRole('textbox', { name: i18n.t('lists.newList') })).toBeNull();
  });

  it('never leaves an item in no list', () => {
    fakeServer();
    renderLists();
    openEdit();
    tapList(PACK);
    expect(listChips().getByRole('button', { name: PACK }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('keeps the item in a list when the only other one picked was a new list left unnamed', () => {
    fakeServer();
    renderLists();
    openEdit();
    fireEvent.click(listChips().getByRole('button', { name: i18n.t('lists.newCategory') }));
    tapList(PACK);
    fireEvent.keyDown(screen.getByRole('textbox', { name: i18n.t('lists.newList') }), {
      key: 'Enter',
    });
    expect(listChips().getByRole('button', { name: PACK }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  /** The item in the food list too, and the 🗑 confirmed. */
  const removeHere = (server: ReturnType<typeof fakeServer>) => {
    server.state.listItems[linkKey('list-food', ITEM)] = { of: ITEM, list: 'list-food' };
    setLiveChanges(structuredClone(server.state));
    const rendered = renderLists();
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('lists.delete', { name: textOf() }) }),
    );
    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.confirmRemoveHere') }));
    return rendered;
  };

  it('takes it out of this list only, asking first', async () => {
    const server = fakeServer();
    removeHere(server);
    await waitFor(() => expect(server.state.listItems[ITEM]).toMatchObject({ list: 'list-food' }));
    expect(server.state.listItems[linkKey('list-food', ITEM)]).toBeUndefined();
  });

  it('says so and keeps it in both lists when taking it out fails', async () => {
    const server = fakeServer();
    server.failures = 1;
    const { toasts } = removeHere(server);
    await waitFor(() => expect(toasts).toEqual([i18n.t('live.errors.failed')]));
    expect(server.state.listItems[ITEM]).toMatchObject({ list: 'pack' });
    expect(screen.getByText(textOf())).toBeTruthy();
  });
});

describe('reordering the lists', () => {
  const chipsNav = () => within(screen.getByRole('navigation', { name: i18n.t('lists.choose') }));
  const hold = async (chip: HTMLElement) => {
    fireEvent.pointerDown(chip, { button: 0, clientX: 40, clientY: 20 });
    await new Promise((done) => setTimeout(done, 500));
  };
  // jsdom has no PointerEvent, and its fallback drops where the finger is.
  const moveTo = (clientX: number) =>
    fireEvent(window, new MouseEvent('pointermove', { clientX, clientY: 20 }));
  afterEach(() => {
    vi.restoreAllMocks();
    delete (document as Partial<Document>).elementFromPoint;
  });

  it('moves a list by holding and dragging it, and saves the new order', async () => {
    const server = fakeServer();
    renderLists();
    const nav = chipsNav();
    const food = nav.getByRole('link', { name: 'אוכל' });
    const first = nav.getAllByRole('link')[0];
    // jsdom has no layout: the held list is at 0–80 and the first list at 100–200, on one row.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const [left, right] = this === first ? [100, 200] : [0, 80];
      return { left, right, top: 0, bottom: 48 } as DOMRect;
    });
    document.elementFromPoint = () => first;

    await hold(food);
    // Over the first list, but not past its middle yet: nothing moves.
    moveTo(120);
    expect(nav.getAllByRole('link')[0]).toBe(first);
    moveTo(160);
    fireEvent.pointerUp(window);
    // The tap that ends the drag doesn't open the list.
    expect(fireEvent.click(food)).toBe(false);

    await waitFor(() => expect(server.saves).toHaveLength(1));
    expect(server.state.lists['list-food']).toMatchObject({ order: 0 });
    expect(nav.getAllByRole('link')[0].textContent).toBe('אוכל');
  });

  it('moves a list to another group when it is let go over that group’s stamp', async () => {
    const server = fakeServer();
    renderLists();
    const noa = screen.getByRole('button', {
      name: new RegExp(i18n.t('lists.groups.noa')),
      pressed: false,
    });
    document.elementFromPoint = () => noa;

    await hold(chipsNav().getByRole('link', { name: 'אוכל' }));
    moveTo(120);
    expect(
      screen.getByText(i18n.t('lists.dropHint', { to: i18n.t('lists.moveTo.noa') })),
    ).toBeTruthy();
    expect(noa.className).toContain('list-group--drop');
    fireEvent.pointerUp(window);

    await waitFor(() => expect(server.saves).toHaveLength(1));
    expect(server.saves[0]).toHaveLength(1);
    expect(server.saves[0][0]).toMatchObject({ key: 'list-food', data: { owner: 'noa' } });
    expect(location.hash).toBe('#/lists/list-food');
    expect(noa.getAttribute('aria-pressed')).toBe('true');
  });

  it('asks for the code when the hold begins on a phone without one, and lifts nothing', async () => {
    const server = fakeServer();
    localStorage.removeItem('japan-together.liveCode');
    renderLists();
    await hold(chipsNav().getByRole('link', { name: 'אוכל' }));

    expect(screen.getByRole('dialog', { name: i18n.t('lists.unlockTitle') })).toBeTruthy();
    expect(screen.queryByText(i18n.t('lists.dragHint'))).toBeNull();
    fireEvent.pointerUp(window);
    expect(server.saves).toHaveLength(0);
  });

  it('does not swallow the next tap after a cancelled drag or a cancelled locked hold', async () => {
    fakeServer();
    renderLists();
    const food = chipsNav().getByRole('link', { name: 'אוכל' });
    await hold(food);
    fireEvent(window, new MouseEvent('pointercancel'));
    expect(fireEvent.click(food)).toBe(true);

    localStorage.removeItem('japan-together.liveCode');
    cleanup();
    renderLists();
    const locked = chipsNav().getByRole('link', { name: 'אוכל' });
    await hold(locked);
    fireEvent.pointerCancel(locked);
    expect(fireEvent.click(locked)).toBe(true);
  });

  it('never lifts a chip once the list page is gone', async () => {
    fakeServer();
    renderLists();
    const food = chipsNav().getByRole('link', { name: 'אוכל' });
    fireEvent.pointerDown(food, { button: 0, clientX: 40, clientY: 20 });
    cleanup();
    await new Promise((done) => setTimeout(done, 500));
    expect(screen.queryByText(i18n.t('lists.dragHint'))).toBeNull();
  });
});

describe('whose lists', () => {
  const groups = () => within(screen.getByRole('group', { name: i18n.t('lists.chooseGroup') }));
  const stamp = (owner: 'dana' | 'noa' | 'both') =>
    groups().getByRole('button', { name: new RegExp(i18n.t(`lists.groups.${owner}`)) });
  // Noa's one list, made Dana's, so Noa has none.
  const noaHasNone = (state: LiveChanges) => {
    state.lists['gifts-noa'] = { owner: 'dana' };
    setLiveChanges(structuredClone(state));
  };
  const chipNames = () =>
    within(screen.getByRole('navigation', { name: i18n.t('lists.choose') }))
      .getAllByRole('link')
      .map((chip) => chip.textContent);

  it('shows the open list’s group, and another group’s lists once its stamp is tapped', () => {
    fakeServer();
    renderLists();
    expect(stamp('both').getAttribute('aria-pressed')).toBe('true');
    expect(chipNames()).toEqual([
      i18n.t('lists.presets.flight'),
      i18n.t('lists.presets.pack'),
      'אוכל',
    ]);
    expect(stamp('noa').textContent).toContain(i18n.t('lists.groupCount', { count: 1 }));

    fireEvent.click(stamp('noa'));
    expect(stamp('noa').getAttribute('aria-pressed')).toBe('true');
    expect(chipNames()).toEqual([i18n.t('lists.presets.giftsNoa')]);
    expect(location.hash).toBe('#/lists/gifts-noa');
  });

  it('opens the new-list form for a group with no lists, and saves the list as that group’s', async () => {
    const server = fakeServer();
    noaHasNone(server.state);
    renderLists();
    fireEvent.click(stamp('noa'));
    const noa = screen.getByRole('button', { name: i18n.t('lists.groups.noa'), pressed: true });
    expect(noa).toBeTruthy();

    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('lists.listName') }), {
      target: { value: 'Shoes' },
    });
    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.save') }));
    await waitFor(() => expect(server.saves).toHaveLength(1));
    expect(server.saves[0][0].data).toMatchObject({ name: 'Shoes', owner: 'noa' });
  });

  it('goes back to the open list’s group when the new list is cancelled', () => {
    noaHasNone(fakeServer().state);
    renderLists();
    fireEvent.click(stamp('noa'));
    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.cancel') }));
    expect(stamp('both').getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('textbox', { name: i18n.t('lists.listName') })).toBeNull();
  });

  const editPack = () => {
    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.editList', { name: PACK }) }));
    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('lists.listName') }), {
      target: { value: 'Suitcase' },
    });
    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.groups.dana') }));
    fireEvent.click(saveButton());
  };

  it('renames a list and moves it to another group from its ✏️, in one save', async () => {
    const server = fakeServer();
    renderLists();
    editPack();
    await waitFor(() => expect(server.saves).toHaveLength(1));
    expect(server.state.lists.pack).toMatchObject({ name: 'Suitcase', owner: 'dana' });
    await waitFor(() => expect(stamp('dana').getAttribute('aria-pressed')).toBe('true'));
    expect(screen.queryByRole('textbox', { name: i18n.t('lists.listName') })).toBeNull();
  });

  it('keeps the list form open with what was typed when the save fails', async () => {
    const server = fakeServer();
    server.listFailures = 1;
    const { toasts } = renderLists();
    editPack();
    await waitFor(() => expect(toasts).toEqual([i18n.t('live.errors.failed')]));
    expect(server.saves).toHaveLength(0);
    expect(
      (screen.getByRole('textbox', { name: i18n.t('lists.listName') }) as HTMLInputElement).value,
    ).toBe('Suitcase');
    expect(stamp('both').getAttribute('aria-pressed')).toBe('true');
  });

  it('moves a list with ⇄ and a tap on the other group', async () => {
    const server = fakeServer();
    renderLists();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.moveList') }));
    fireEvent.click(
      screen.getByRole('button', {
        name: i18n.t('lists.moveListTo', { to: i18n.t('lists.moveTo.noa') }),
      }),
    );
    await waitFor(() => expect(server.state.lists.pack).toMatchObject({ owner: 'noa' }));
    expect(
      screen.queryByRole('button', {
        name: i18n.t('lists.moveListTo', { to: i18n.t('lists.moveTo.noa') }),
      }),
    ).toBeNull();
  });
});
