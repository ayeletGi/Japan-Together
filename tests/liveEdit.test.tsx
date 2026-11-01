// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SheetContext, type SheetContent } from '../src/app/sheetContext';
import { ToastContext } from '../src/app/toastContext';
import {
  liveChanges,
  setLiveChanges,
  showLocally,
  useLiveVersion,
  type EventChange,
  type LiveChanges,
} from '../src/data/live';
import seed from '../src/data/live-seed.json';
import { getDay, getEvent } from '../src/data/trip';
import { DayPlan } from '../src/features/itinerary/DayPlan';
import { baseStops, type PlanStop } from '../src/features/itinerary/stops';
import i18n from '../src/i18n';
import { eventForm, mergeEventChange, swapTimes } from '../src/lib/liveEdit';

const DAY = '2037-11-03';
const STOP = 'd3-05';
const CODE = '246810';
const base = seed as LiveChanges;

type Entry = { kind: string; key: string; data: EventChange | null; merge?: boolean };

/** A tiny copy of worker/index.ts: one code, a version, and undo that reverts a whole save. */
function fakeServer() {
  const state: LiveChanges = structuredClone({ ...base, version: base.version + 100 });
  const saves: { key: string; before: EventChange | undefined }[][] = [];
  const undoScopes: unknown[] = [];
  const requests: { path: string; body?: { changes?: Entry[] } }[] = [];
  const put = (key: string, data: EventChange | null | undefined) => {
    if (data) state.events[key] = data;
    else delete state.events[key];
  };
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const path = new URL(input).pathname.replace(/^\/api/, '');
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ path, body });
    const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
    if (path === '/changes') return reply(state);
    const auth = (init.headers as Record<string, string>).Authorization;
    if (auth !== `Bearer ${CODE}`) return reply({ error: 'wrong code' }, 401);
    if (path === '/me') return reply({ who: 'dana' });
    if (path === '/change') {
      const entries: Entry[] = body.changes ?? [body];
      saves.push(entries.map(({ key }) => ({ key, before: state.events[key] })));
      for (const { key, data, merge } of entries) {
        put(key, data && merge ? { ...state.events[key], ...data } : data);
      }
      state.version += 1;
      return reply({ version: state.version });
    }
    if (path === '/undo') {
      undoScopes.push(body);
      const last = saves.pop();
      if (!last) return reply({ error: 'nothing to undo' }, 404);
      for (const { key, before } of last) put(key, before);
      state.version += 1;
      return reply({ version: state.version });
    }
    return reply({ error: 'not found' }, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { state, requests, undoScopes };
}

function renderPlan() {
  const toasts: string[] = [];
  const api = {
    current: null,
    open: (content: SheetContent) => void content,
    close: () => undefined,
  };
  render(
    <SheetContext.Provider value={api}>
      <ToastContext.Provider value={(message) => toasts.push(message)}>
        <DayPlan date={DAY} now={null} reached={0} />
      </ToastContext.Provider>
    </SheetContext.Provider>,
  );
  return { toasts };
}

const stopsOfDay = () => baseStops(getDay(DAY)!);
const titleOf = (id: string) => stopsOfDay().find((stop) => stop.id === id)!.title;
const editButton = (id: string) =>
  screen.getByRole('button', { name: i18n.t('live.editStop', { title: titleOf(id) }) });
const button = (key: `live.${string}`) =>
  screen.getByRole('button', { name: i18n.t(key as 'live.save') });
const field = (key: `live.${string}`) => screen.getByLabelText(i18n.t(key as 'live.code'));
/** The movable stop just before STOP, which ▲ swaps with. */
const previous = () => {
  const stops = stopsOfDay();
  const index = stops.findIndex((stop) => stop.id === STOP);
  return stops
    .slice(0, index)
    .reverse()
    .find((stop) => stop.event && !stop.pinned)!;
};

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setLiveChanges({ ...base, version: -1 });
});

describe('mergeEventChange', () => {
  const event = getEvent(STOP)!;
  const before = eventForm(event, { title: 'Card', description: 'Desc' });

  it('holds only the fields that differ (the server merges them in)', () => {
    const after = { ...before, displayTitle: ' New card ', time: '' };
    expect(mergeEventChange(before, after)).toEqual({ displayTitle: 'New card', time: null });
  });

  it('is null when nothing changed', () => {
    expect(mergeEventChange(before, { ...before })).toBeNull();
  });
});

describe('swapTimes', () => {
  it('swaps with the nearest movable stop and jumps over pinned ones', () => {
    const stops = stopsOfDay();
    const other = previous();
    const mine = stops.find((stop) => stop.id === STOP)!;
    const changes = swapTimes(stops, STOP, -1)!;
    expect(Object.keys(changes).sort()).toEqual([STOP, other.id].sort());
    expect(changes[STOP].time).toBe(other.time);
    expect(changes[other.id].time).toBe(mine.time);
  });

  it('never makes the two overlap: a long stop moved first pushes the other after it', () => {
    const stop = (id: string, time: string, end: string | null) =>
      ({
        id,
        minutes: Number(time.slice(0, 2)) * 60 + Number(time.slice(3)),
        pinned: false,
        event: { id, end },
      }) as unknown as PlanStop;
    const stops = [stop('a', '10:00', '10:30'), stop('b', '11:00', '13:00')];
    expect(swapTimes(stops, 'b', -1)).toEqual({
      b: { time: '10:00', end: '12:00' },
      a: { time: '12:00', end: '12:30' },
    });
    // A short stop moved first leaves the other in the later slot.
    const short = [stop('a', '10:00', '12:00'), stop('b', '13:00', null)];
    expect(swapTimes(short, 'a', 1)).toEqual({
      b: { time: '10:00' },
      a: { time: '13:00', end: '15:00' },
    });
  });

  it('is null at the ends and for pinned stops', () => {
    const stops = stopsOfDay();
    const movable = stops.filter((stop) => stop.event && !stop.pinned);
    expect(swapTimes(stops, movable[0].id, -1)).toBeNull();
    expect(swapTimes(stops, movable.at(-1)!.id, 1)).toBeNull();
    const pinned = stops.find((stop) => stop.pinned);
    if (pinned) expect(swapTimes(stops, pinned.id, 1)).toBeNull();
  });
});

describe('editing a stop in place', () => {
  it('has no edit-all button; ✏️ asks for the code once, then saves for everyone', async () => {
    const server = fakeServer();
    const { toasts } = renderPlan();
    expect(screen.queryByRole('button', { name: i18n.t('edit.start') })).toBeNull();

    fireEvent.click(editButton(STOP));
    fireEvent.change(field('live.code'), { target: { value: '111111' } });
    fireEvent.click(button('live.unlock'));
    expect((await screen.findByRole('alert')).textContent).toBe(i18n.t('live.errors.wrong'));

    fireEvent.change(field('live.code'), { target: { value: CODE } });
    fireEvent.click(button('live.unlock'));
    const title = await waitFor(() => field('live.fields.displayTitle'));
    expect(localStorage.getItem('japan-together.liveCode')).toBe(`"${CODE}"`);

    fireEvent.change(title, { target: { value: 'ראמן טבעוני' } });
    fireEvent.change(field('live.fields.time'), { target: { value: '19:15' } });
    fireEvent.click(button('live.save'));

    await waitFor(() => expect(toasts).toEqual([i18n.t('live.saved')]));
    const saved = server.requests.find((r) => r.path === '/change')!.body!.changes!;
    expect(saved).toEqual([
      {
        kind: 'events',
        key: STOP,
        data: { displayTitle: 'ראמן טבעוני', time: '19:15' },
        merge: true,
      },
    ]);
    expect(getEvent(STOP)!.time).toBe('19:15');
    expect(screen.getByText('ראמן טבעוני')).toBeTruthy();
    // The card is closed again.
    expect(screen.queryByLabelText(i18n.t('live.fields.displayTitle'))).toBeNull();
  });

  it('moves a stop up by swapping times, and one undo puts both back', async () => {
    const server = fakeServer();
    localStorage.setItem('japan-together.liveCode', JSON.stringify(CODE));
    const { toasts } = renderPlan();
    const other = previous();
    const [mine, theirs] = [getEvent(STOP)!.time, getEvent(other.id)!.time];

    fireEvent.click(editButton(STOP));
    fireEvent.click(button('live.up'));
    await waitFor(() => expect(toasts).toContain(i18n.t('live.moved')));
    expect(getEvent(STOP)!.time).toBe(theirs);
    expect(getEvent(other.id)!.time).toBe(mine);

    fireEvent.click(button('live.undo'));
    await waitFor(() => expect(toasts).toContain(i18n.t('live.undone')));
    // Undo in a stop's editor only asks for that stop's last change.
    expect(server.undoScopes).toEqual([{ kind: 'events', key: STOP }]);
    expect(getEvent(STOP)!.time).toBe(mine);
    expect(getEvent(other.id)!.time).toBe(theirs);
  });

  it('removes a stop for everyone', async () => {
    fakeServer();
    localStorage.setItem('japan-together.liveCode', JSON.stringify(CODE));
    renderPlan();
    fireEvent.click(editButton(STOP));
    fireEvent.click(button('live.remove'));
    // It asks first.
    expect(getEvent(STOP)).toBeDefined();
    fireEvent.click(button('live.confirmRemove'));
    await waitFor(() => expect(getEvent(STOP)).toBeUndefined());
  });

  it('keeps what is being typed when a new copy arrives from the other phone', () => {
    fakeServer();
    localStorage.setItem('japan-together.liveCode', JSON.stringify(CODE));
    renderPlan();
    fireEvent.click(editButton(STOP));
    fireEvent.change(field('live.fields.displayTitle'), { target: { value: 'half typed' } });
    act(() => {
      setLiveChanges({ ...base, version: base.version + 50 });
    });
    expect((field('live.fields.displayTitle') as HTMLInputElement).value).toBe('half typed');
  });

  it('redraws with a saved change at once, before the server answers', () => {
    const { result } = renderHook(() => useLiveVersion());
    const [drawn, version] = [result.current, liveChanges().version];
    let shown: ReturnType<typeof showLocally> | undefined;
    act(() => {
      shown = showLocally('events', { [STOP]: { time: '21:00' } });
    });
    expect(liveChanges().version).toBe(version);
    expect(result.current).not.toBe(drawn);
    act(() => shown?.putBack());
  });

  it('forgets a code the server no longer accepts and asks again', async () => {
    fakeServer();
    localStorage.setItem('japan-together.liveCode', JSON.stringify('999999'));
    renderPlan();
    fireEvent.click(editButton(STOP));
    fireEvent.click(button('live.up'));
    await screen.findByRole('button', { name: i18n.t('live.unlock') });
    expect(localStorage.getItem('japan-together.liveCode')).toBeNull();
  });
});
