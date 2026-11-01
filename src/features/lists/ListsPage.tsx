import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { Sheet, SheetHeader } from '../../components/Sheet';
import { useLiveChanges } from '../../data/live';
import { useLocalState } from '../../hooks/useLocalState';
import { useSave } from '../../hooks/useSave';
import type { ListOwner } from '../../../shared/liveSchema';
import { useLanguage } from '../../i18n';
import { photoUrl, saveListEntries, savedCode, savedWho } from '../../lib/liveEdit';
import { UnlockForm } from '../itinerary/LiveEditCard';
import { AddItemForm } from './AddItemForm';
import {
  buildLists,
  FLIGHT_LIST,
  GIFT_LIST,
  moveList,
  newList,
  OPEN_LIST_KEY,
  orderWithGroup,
  reorderLists,
  type List,
} from './lists';
import { ListChips } from './ListChips';
import { ListGroups } from './ListGroups';
import { ListView } from './ListView';
import { giftsOnThisPhone, moveOldLists } from './moveOldLists';
import { ListForm } from './ListForm';
import '../checklist/checklist.css';
import './lists.css';

/**
 * The Lists tab ("רשימות"): before the flight, to pack, a gift list each, and any list we add.
 * Shared through the live database, so we both see every tick and edit; changing them needs the
 * personal code once per phone.
 */
export function ListsPage({ listId }: { listId?: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const data = useLiveChanges();
  const lists = buildLists(data, lang);
  const [lastOpen, setLastOpen] = useLocalState(OPEN_LIST_KEY, FLIGHT_LIST);
  const [creating, setCreating] = useState(false);
  const [unlocked, setUnlocked] = useState(() => !!savedCode());
  // The + sheet: the code first if this phone has none yet, then the add form.
  const [sheet, setSheet] = useState<null | 'add' | 'code'>(null);
  // The category the add form starts with: a category's own + picks it, the big + none.
  const [addCategory, setAddCategory] = useState('');
  const askCode = () => setSheet('code');
  const openAdd = (category: string) => {
    setAddCategory(category);
    setSheet(unlocked ? 'add' : 'code');
  };
  const [phoneGifts, setPhoneGifts] = useState(giftsOnThisPhone);
  const save = useSave(() => setUnlocked(false));
  // Claude's code has no gift list, so its phone keeps its gifts where they are.
  const giftsMoving = unlocked && !!GIFT_LIST[savedWho() ?? ''];
  const list = lists.find((each) => each.id === (listId ?? lastOpen)) ?? lists[0];
  const listName = (each: List) => each.name || t(`lists.presets.${each.preset ?? 'pack'}`);
  // Where every list is named together (an item's lists), a list of one of us says whose.
  const fullName = (each: List) =>
    each.owner === 'both'
      ? listName(each)
      : t('lists.ownedName', { name: listName(each), owner: t(`lists.groups.${each.owner}`) });
  // Whose lists the chips show: the open list's group, until another stamp is picked.
  const [group, setGroup] = useState<ListOwner>(list?.owner ?? 'both');
  const [groupOf, setGroupOf] = useState(list?.id);
  if (list && list.id !== groupOf) {
    setGroupOf(list.id);
    setGroup(list.owner);
  }
  const groupLists = lists.filter((each) => each.owner === group);
  // The stamp a lifted chip is over, which takes its list when let go.
  const [dropTarget, setDropTarget] = useState<ListOwner>();
  const onDropTarget = useCallback((owner?: ListOwner) => setDropTarget(owner), []);
  // A moved list stays open, now among its new group's lists.
  const moveTo = async (id: string, owner: ListOwner, name?: string) => {
    const saved = await save(() => saveListEntries('lists', moveList(id, owner, name)));
    if (saved) {
      setGroup(owner);
      setCreating(false);
      location.hash = paths.lists(id);
    }
    return saved;
  };
  // A group with no lists yet opens the new-list form, already set to that group.
  const pickGroup = (owner: ListOwner) => {
    setGroup(owner);
    if (list?.owner === owner) return setCreating(false);
    const first = lists.find((each) => each.owner === owner);
    setCreating(!first);
    if (first) location.hash = paths.lists(first.id);
  };
  const sheetTitle =
    sheet === 'add' && list ? t('lists.addTo', { name: listName(list) }) : t('lists.unlockTitle');

  useEffect(() => {
    if (list && list.id !== lastOpen) setLastOpen(list.id);
  }, [list, lastOpen, setLastOpen]);

  // Every list's photos, so the phone keeps them for offline (build-web.mjs) before they are seen.
  const photoIds = lists
    .flatMap((each) => each.items.map((item) => item.photo).filter(Boolean))
    .join(' ');
  useEffect(() => {
    if (!navigator.onLine || !photoIds) return;
    for (const id of photoIds.split(' ')) void fetch(photoUrl(id)).catch(() => undefined);
  }, [photoIds]);

  useEffect(() => {
    if (unlocked) void moveOldLists().then(() => setPhoneGifts(giftsOnThisPhone()));
  }, [unlocked]);

  return (
    <div className="wrap lists stack">
      <header className="lists-head">
        <p className="lists-kicker">{t('lists.kicker')}</p>
        <h1>{t('lists.title')}</h1>
      </header>

      <ListGroups lists={lists} group={group} dropTarget={dropTarget} onPick={pickGroup} />

      <ListChips
        lists={groupLists}
        group={group}
        currentId={list?.id}
        creating={creating}
        listName={listName}
        onPick={() => setCreating(false)}
        onNew={() => setCreating(true)}
        unlocked={unlocked}
        onLocked={askCode}
        onDropTarget={onDropTarget}
        onMove={(id, owner) => void moveTo(id, owner)}
        onReorder={(ids) =>
          void save(() =>
            saveListEntries(
              'lists',
              reorderLists(
                data,
                orderWithGroup(
                  lists.map((each) => each.id),
                  ids,
                ),
              ),
            ),
          )
        }
      />

      {phoneGifts.length > 0 && (
        <div className="card list-phone-gifts" role="status">
          <p>
            {t(giftsMoving ? 'lists.phoneGiftsMoving' : 'lists.phoneGifts', {
              count: phoneGifts.length,
            })}
          </p>
          <ul>
            {phoneGifts.map((gift) => (
              <li key={gift.id}>
                {gift.what || gift.for}
                {gift.what && gift.for && <small className="muted"> · {gift.for}</small>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {creating ? (
        <ListForm
          key={group}
          title={t('lists.newList')}
          owner={group}
          onCancel={() => {
            setCreating(false);
            if (list) setGroup(list.owner);
          }}
          onSave={async (name, owner) => {
            if (!unlocked) return askCode();
            const { id, change } = newList(data, name, owner);
            if (await save(() => saveListEntries('lists', { [id]: change }))) {
              setCreating(false);
              location.hash = paths.lists(id);
            }
          }}
        />
      ) : (
        list && (
          <ListView
            key={list.id}
            list={list}
            lists={lists}
            listName={listName}
            fullName={fullName}
            locked={!unlocked}
            save={save}
            onLocked={askCode}
            onAdd={openAdd}
            onMove={(owner, name) => moveTo(list.id, owner, name)}
          />
        )
      )}
      <p className="small-note">{t('lists.shared')}</p>

      {list && !creating && (
        <button
          type="button"
          className="fab"
          aria-label={t('lists.addTo', { name: listName(list) })}
          onClick={() => openAdd('')}
        >
          <Plus size={30} strokeWidth={2.4} aria-hidden="true" />
        </button>
      )}

      {/* On <body>, so the page's slide-in doesn't trap it under the tab bar. */}
      {sheet &&
        createPortal(
          <Sheet label={sheetTitle} onClose={() => setSheet(null)}>
            <SheetHeader title={sheetTitle} onClose={() => setSheet(null)} />
            <div className="sheet-body">
              {sheet === 'code' || !list ? (
                <UnlockForm
                  onUnlocked={() => {
                    setUnlocked(true);
                    setSheet(list && !creating ? 'add' : null);
                  }}
                />
              ) : (
                <AddItemForm
                  key={`${list.id}:${addCategory}`}
                  list={list}
                  startCategory={addCategory}
                  save={save}
                />
              )}
            </div>
          </Sheet>,
          document.body,
        )}
    </div>
  );
}
