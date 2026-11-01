import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import type { ListOwner } from '../../../shared/liveSchema';
import { moveId, reconcileOrder, type List } from './lists';

/** How long a press must last before the chip lifts, and how far a finger may drift before. */
const HOLD_MS = 450;
const DRIFT_PX = 8;

/**
 * Whether the finger has passed the middle of the chip it is over, coming from the gap: only then
 * do the two swap, so chips of different widths don't swap straight back.
 */
function pastMiddle(gap: Element, over: Element, x: number, y: number) {
  const from = gap.getBoundingClientRect();
  const to = over.getBoundingClientRect();
  if (from.top < to.bottom && to.top < from.bottom) {
    const middle = (to.left + to.right) / 2;
    return from.left < to.left ? x > middle : x < middle;
  }
  const middle = (to.top + to.bottom) / 2;
  return from.top < to.top ? y > middle : y < middle;
}

interface Drag {
  id: string;
  /** Where the lifted chip is drawn: the finger, less where on the chip it was picked up. */
  x: number;
  y: number;
  dx: number;
  dy: number;
  label: string;
  /** The order so far, shown while dragging and saved on release. */
  order: string[];
  /** The other group's stamp the chip is over, which gets the list on release. */
  target?: ListOwner;
}

/**
 * The row of list chips with "+ new list". A long press lifts a chip; dragging it over another
 * moves it there, and letting go saves the new order (`onReorder`). Let go over another group's
 * stamp, the list moves to that group instead (`onMove`).
 */
export function ListChips({
  lists,
  group,
  currentId,
  creating,
  listName,
  onPick,
  unlocked,
  onLocked,
  onNew,
  onReorder,
  onDropTarget,
  onMove,
}: {
  lists: List[];
  /** Whose lists these are. */
  group: ListOwner;
  currentId?: string;
  creating: boolean;
  listName: (list: List) => string;
  onPick: () => void;
  /** Reordering is saved for both phones, so it needs the personal code first. */
  unlocked: boolean;
  onLocked: () => void;
  onNew: () => void;
  onReorder: (ids: string[]) => void;
  /** The stamp a lifted chip is over, so it can show it takes the list. */
  onDropTarget: (owner?: ListOwner) => void;
  onMove: (id: string, owner: ListOwner) => void;
}) {
  const { t } = useTranslation();
  const nav = useRef<HTMLElement>(null);
  const [drag, setDragState] = useState<Drag | null>(null);
  // The same drag, for the window listeners and the touch listener, which outlive a render.
  const latest = useRef<Drag | null>(null);
  const setDrag = useCallback((next: Drag | null) => {
    latest.current = next;
    setDragState(next);
  }, []);
  // The press waiting to become a drag, and whether the click after a drag should be ignored.
  const press = useRef<{ timer: number; x: number; y: number } | null>(null);
  const skipClick = useRef(false);
  const ids = useMemo(() => lists.map((each) => each.id), [lists]);

  // Once a chip is lifted the finger moves it, not the page. Chrome only lets a touch listener
  // stop scrolling if it was there when the touch began, so it stays on and checks for a drag.
  useEffect(() => {
    const element = nav.current;
    const stopScroll = (event: TouchEvent) => {
      if (latest.current) event.preventDefault();
    };
    element?.addEventListener('touchmove', stopScroll, { passive: false });
    return () => element?.removeEventListener('touchmove', stopScroll);
  }, []);

  const endPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  };
  useEffect(() => endPress, []);

  const startPress = (event: PointerEvent<HTMLAnchorElement>, list: List) => {
    if (event.button > 0) return;
    const chip = event.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    endPress();
    skipClick.current = false;
    press.current = {
      x,
      y,
      timer: window.setTimeout(() => {
        press.current = null;
        skipClick.current = true;
        if (!unlocked) {
          onLocked();
          return;
        }
        navigator.vibrate?.(15);
        setDrag({
          id: list.id,
          x,
          y,
          dx: x - chip.left,
          dy: y - chip.top,
          label: listName(list),
          order: ids,
        });
      }, HOLD_MS),
    };
  };

  // While a chip is lifted, the whole window follows the finger, so it never slips off.
  const lifted = drag !== null;
  useEffect(() => {
    if (!lifted) return;
    const move = (event: globalThis.PointerEvent) => {
      const now = latest.current;
      if (!now) return;
      const chip = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-list-id]');
      const over = chip?.dataset.listId;
      const gap = [...(nav.current?.querySelectorAll<HTMLElement>('[data-list-id]') ?? [])].find(
        (each) => each.dataset.listId === now.id,
      );
      const swap =
        chip &&
        over &&
        gap &&
        over !== now.id &&
        pastMiddle(gap, chip, event.clientX, event.clientY);
      const order = swap
        ? moveId(now.order, now.order.indexOf(now.id), now.order.indexOf(over))
        : now.order;
      const stamp = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-owner]')?.dataset.owner as ListOwner | undefined;
      const target = stamp === group ? undefined : stamp;
      setDrag({ ...now, x: event.clientX, y: event.clientY, order, target });
    };
    const release = () => {
      const now = latest.current;
      setDrag(null);
      if (now?.target) return onMove(now.id, now.target);
      // Lists may have come or gone (the other phone) since the chip was lifted. Lists only moved
      // meanwhile by the other phone are overwritten by this order.
      const order = reconcileOrder(now?.order ?? ids, ids);
      if (order.join(' ') !== ids.join(' ')) onReorder(order);
    };
    const cancel = () => {
      // No click follows a cancelled touch, so the next tap must not be swallowed.
      skipClick.current = false;
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [lifted, ids, group, onReorder, onMove, setDrag]);

  const target = drag?.target;
  useEffect(() => onDropTarget(target), [target, onDropTarget]);

  const shown = drag
    ? reconcileOrder(drag.order, ids).map((id) => lists.find((each) => each.id === id)!)
    : lists;

  return (
    <>
      <nav ref={nav} className="chip-row list-chips" aria-label={t('lists.choose')}>
        {shown.map((each) => (
          <a
            key={each.id}
            href={paths.lists(each.id)}
            data-list-id={each.id}
            draggable={false}
            className={drag?.id === each.id ? 'chip list-chip list-chip--gap' : 'chip list-chip'}
            aria-current={each.id === currentId && !creating ? 'page' : undefined}
            onPointerDown={(event) => startPress(event, each)}
            onPointerMove={(event) => {
              const start = press.current;
              if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRIFT_PX)
                endPress();
            }}
            onPointerUp={endPress}
            onPointerCancel={() => {
              endPress();
              // A hold that fired without lifting (no code) gets no click either.
              skipClick.current = false;
            }}
            onContextMenu={(event) => event.preventDefault()}
            onClick={(event) => {
              if (skipClick.current) {
                skipClick.current = false;
                event.preventDefault();
                return;
              }
              onPick();
            }}
          >
            {listName(each)}
          </a>
        ))}
        <button
          type="button"
          className="chip list-new-chip"
          aria-pressed={creating}
          onClick={onNew}
        >
          <Plus size={14} aria-hidden="true" />
          {t('lists.newList')}
        </button>
      </nav>
      {drag && (
        <>
          <p className="small-note list-drag-hint" role="status">
            {drag.target
              ? t('lists.dropHint', { to: t(`lists.moveTo.${drag.target}`) })
              : t('lists.dragHint')}
          </p>
          {/* On <body>, so the page's slide-in transform doesn't shift it off the finger. */}
          {createPortal(
            <span
              className="chip list-chip list-chip--lifted"
              aria-hidden="true"
              style={{ left: drag.x - drag.dx, top: drag.y - drag.dy }}
            >
              {drag.label}
            </span>,
            document.body,
          )}
        </>
      )}
    </>
  );
}
