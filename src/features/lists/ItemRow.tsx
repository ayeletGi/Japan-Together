import {
  Check,
  ExternalLink as ExternalLinkIcon,
  Layers,
  Link2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../app/toastContext';
import { ExternalLink } from '../../components/ExternalLink';
import { Sheet, SheetHeader } from '../../components/Sheet';
import { useLiveChanges } from '../../data/live';
import type { Save } from '../../hooks/useSave';
import { useContentProps } from '../../i18n';
import { photoUrl, saveListEntries, saveTogether } from '../../lib/liveEdit';
import { CategoryPicker, NewChip } from './CategoryPicker';
import { EditBar } from './EditBar';
import { LinkField, Photo, PhotoField } from './ItemExtras';
import { savePhoto, type PhotoChoice } from './itemPhoto';
import {
  carriedCategory,
  editItem,
  itemView,
  MAX_ITEM_LISTS,
  newList,
  removeFrom,
  setDone,
  type Item,
  type List,
  POINTS_PER_ITEM,
} from './lists';

/**
 * One item: tap the circle to tick, the rest of the card (or ✏️) to change its text, lists or
 * category in place; 🗑 (asks first) to take it out of this list, or delete it when it is in no
 * other list. An item in several lists says so on its card.
 */
export function ItemRow({
  list,
  lists,
  listName,
  item,
  gifts,
  locked,
  save,
  onLocked,
  failed,
  onFailed,
}: {
  list: List;
  lists: List[];
  listName: (list: List) => string;
  item: Item;
  gifts: boolean;
  locked: boolean;
  save: Save;
  onLocked: () => void;
  /** This item's edit whose save failed, to open again. */
  failed?: Draft;
  /** Keeps an edit whose save failed (none: the form was closed or sent again). */
  onFailed: (draft?: Draft) => void;
}) {
  const { t } = useTranslation();
  const content = useContentProps();
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm'>('view');
  const data = useLiveChanges();
  const [draft, setDraft] = useState(() => itemDraft(item));
  const { text, note, category, targets, newName, photo, link } = draft;
  const change = (part: Partial<Draft>) => setDraft((was) => ({ ...was, ...part }));
  const [typingList, setTypingList] = useState(false);
  const [viewing, setViewing] = useState(false);
  const toast = useToast();
  const titleId = useId();
  const noteId = useId();
  const fill = (next: Draft) => {
    setDraft(next);
    setTypingList(false);
  };
  // Saving failed: open the edit again with what was typed, in this row or the one that came back.
  const [reopened, setReopened] = useState<Draft>();
  if (failed !== reopened) {
    setReopened(failed);
    if (failed) {
      fill(failed);
      setMode('edit');
    }
  }
  // The list whose categories the picker offers: this one while it is picked, else the first.
  const categoryList = (picked: Draft): List => {
    const id = picked.targets.includes(list.id) ? list.id : picked.targets[0];
    return id === ''
      ? { id: '', name: picked.newName, owner: list.owner, items: [] }
      : (lists.find((each) => each.id === id) ?? list);
  };
  const startEdit = () => fill(itemDraft(item));
  const pickLists = (next: string[]) =>
    setDraft((was) => ({
      ...was,
      targets: next,
      category: carriedCategory(
        categoryList(was),
        categoryList({ ...was, targets: next }),
        was.category,
      ),
    }));
  // Adds a list unless the item is in as many as one save can hold; says whether it did.
  const addList = (id: string) => {
    if (targets.length >= MAX_ITEM_LISTS) {
      toast(t('lists.tooManyLists', { count: MAX_ITEM_LISTS }));
      return false;
    }
    pickLists([...targets, id]);
    return true;
  };
  // Tapping a list adds or takes it away; the item always stays in at least one.
  const toggleList = (id: string) =>
    targets.includes(id)
      ? targets.length > 1 && pickLists(targets.filter((each) => each !== id))
      : addList(id);
  // Done typing the new list's name; with none typed, no new list (and never no list at all).
  const endTypingList = () => {
    setTypingList(false);
    if (newName.trim()) return;
    const rest = targets.filter((id) => id !== '');
    pickLists(rest.length > 0 ? rest : [list.id]);
  };
  const linked = targets.length > 1;
  const otherLists = item.lists
    .filter((id) => id !== list.id)
    .map((id) => lists.find((each) => each.id === id))
    .filter((each) => !!each)
    .map(listName);
  const shown = itemView(item);

  if (mode === 'edit') {
    return (
      <li>
        <form
          className="card list-edit"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!text.trim() || (targets.includes('') && !newName.trim())) return;
            setMode('view');
            onFailed();
            const saved = await save(async () => {
              const photoId = await savePhoto(photo);
              // A new list is saved with the item in one go: never made without it, or twice.
              const made = targets.includes('') ? newList(data, newName, list.owner) : undefined;
              const chosen = targets.map((id) => (id === '' ? made!.id : id));
              await saveTogether({
                lists: made && { [made.id]: made.change },
                listItems: editItem(item, {
                  text,
                  note,
                  category,
                  lists: chosen,
                  photo: photoId,
                  link,
                }),
              });
            });
            if (!saved) onFailed(draft);
          }}
        >
          <EditBar
            title={t('lists.editTitle')}
            onCancel={() => {
              startEdit();
              setMode('view');
              onFailed();
            }}
          />
          <input
            className="input"
            aria-label={gifts ? t('lists.giftWhat') : t('lists.item')}
            value={text}
            onChange={(event) => change({ text: event.target.value })}
            {...content}
          />
          <input
            className="input"
            aria-label={gifts ? t('lists.giftFor') : t('lists.note')}
            placeholder={gifts ? t('lists.giftFor') : t('lists.note')}
            value={note}
            onChange={(event) => change({ note: event.target.value })}
            {...content}
          />
          <div className="list-extras">
            <PhotoField value={photo} onChange={(chosen) => change({ photo: chosen })} />
            <LinkField value={link} onChange={(typed) => change({ link: typed })} />
          </div>
          <fieldset className="list-categories">
            <legend className="muted">{t('lists.list')}</legend>
            <div className="chip-row">
              {lists.map((each) => (
                <button
                  type="button"
                  key={each.id}
                  className="chip"
                  aria-pressed={targets.includes(each.id)}
                  onClick={() => toggleList(each.id)}
                >
                  {linked && targets.includes(each.id) && <Link2 size={15} aria-hidden="true" />}
                  {listName(each)}
                </button>
              ))}
              {!typingList && targets.includes('') && (
                <button
                  type="button"
                  className="chip"
                  aria-pressed="true"
                  onClick={() => setTypingList(true)}
                >
                  {linked && <Link2 size={15} aria-hidden="true" />}
                  {newName.trim()}
                </button>
              )}
              <NewChip
                typing={typingList}
                inputLabel={t('lists.newList')}
                placeholder={t('lists.listNamePlaceholder')}
                maxLength={200}
                value={newName}
                onChange={(name) => change({ newName: name })}
                onStart={() => {
                  change({ newName: '' });
                  if (!targets.includes('') && !addList('')) return;
                  setTypingList(true);
                }}
                onDone={endTypingList}
                inputProps={content}
              />
            </div>
          </fieldset>
          {linked && (
            <p className="list-linked-note">
              <Link2 size={16} aria-hidden="true" />
              {t('lists.linkedNote')}
            </p>
          )}
          <CategoryPicker
            key={categoryList(draft).id}
            list={categoryList(draft)}
            value={category}
            onChange={(picked) => change({ category: picked })}
          />
        </form>
      </li>
    );
  }

  return (
    <li className="list-row">
      <div className="list-card">
        <div className={item.done ? 'todo todo--done list-todo' : 'todo list-todo'}>
          <button
            type="button"
            className="list-tick"
            aria-pressed={item.done}
            aria-label={t('lists.doneToggle', { name: shown.text })}
            onClick={async () => {
              if (locked) return onLocked();
              const ticking = !item.done;
              const saved = await save(() =>
                saveListEntries('listItems', setDone(item, list.id, ticking)),
              );
              // A tick earns points, like a stamp on the day's rally (its group's sticker pops).
              if (saved && ticking) toast(t('lists.newPoints', { points: POINTS_PER_ITEM }));
            }}
          >
            <span className="todo-tick" aria-hidden="true">
              <Check size={15} />
            </span>
          </button>
          {/* The whole text opens the edit, but the link beside the name is a link of its own,
              so the button lies under the text instead of holding it. */}
          <div className="list-open">
            <button
              type="button"
              className="list-open-button"
              aria-labelledby={shown.note ? `${titleId} ${noteId}` : titleId}
              onClick={() => {
                if (locked) return onLocked();
                startEdit();
                setMode('edit');
              }}
            />
            <span className="todo-text" {...content}>
              <span className="list-title-row">
                <span className="todo-title" id={titleId}>
                  {shown.text}
                </span>
                {shown.link && (
                  <ExternalLink
                    className="list-link"
                    href={shown.link}
                    aria-label={t('lists.openLink', { name: shown.text })}
                  >
                    <ExternalLinkIcon size={13} aria-hidden="true" />
                    {t('lists.link')}
                  </ExternalLink>
                )}
              </span>
              {shown.note && (
                <small className="muted" id={noteId}>
                  {shown.note}
                </small>
              )}
              {otherLists.length > 0 && (
                <span className="list-linked">
                  <Layers size={12} aria-hidden="true" />
                  {t('lists.alsoIn')} {otherLists.join(' · ')}
                </span>
              )}
            </span>
          </div>
        </div>
        {item.photo && (
          <button
            type="button"
            className="list-thumb"
            aria-label={t('lists.photoOf', { name: shown.text })}
            onClick={() => setViewing(true)}
          >
            <Photo src={photoUrl(item.photo)} />
          </button>
        )}
        {!locked && (
          <div className="list-item-actions">
            {mode === 'confirm' ? (
              <>
                <button
                  type="button"
                  className="btn btn--small btn--danger"
                  autoFocus
                  onClick={() => {
                    setMode('view');
                    void save(() => saveListEntries('listItems', removeFrom(item, list.id)));
                  }}
                >
                  {item.lists.length > 1 ? t('lists.confirmRemoveHere') : t('lists.confirmDelete')}
                </button>
                <button
                  type="button"
                  className="list-item-action"
                  aria-label={t('lists.cancel')}
                  onClick={() => setMode('view')}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="list-item-action"
                  aria-label={t('lists.edit', { name: shown.text })}
                  onClick={() => {
                    startEdit();
                    setMode('edit');
                  }}
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="list-item-action"
                  aria-label={t('lists.delete', { name: shown.text })}
                  onClick={() => setMode('confirm')}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {viewing &&
        item.photo &&
        createPortal(
          <Sheet label={t('lists.photoOf', { name: shown.text })} onClose={() => setViewing(false)}>
            <SheetHeader
              title={<span {...content}>{shown.text}</span>}
              sub={shown.note && <span {...content}>{shown.note}</span>}
              onClose={() => setViewing(false)}
            />
            <div className="sheet-body">
              <Photo src={photoUrl(item.photo)} big />
            </div>
          </Sheet>,
          document.body,
        )}
    </li>
  );
}

/** What an item's edit form holds. */
export interface Draft {
  text: string;
  note: string;
  category: string;
  /** Every list it should be in; '' is a new one named `newName`. */
  targets: string[];
  newName: string;
  photo: PhotoChoice;
  link: string;
}

/**
 * An item's edit form as it opens: the item as it is, in the lists it is in. An address still in
 * its name or note moves to the link box, so saving the edit keeps it there.
 */
function itemDraft(item: Item): Draft {
  const { text, note, link } = itemView(item);
  return {
    text,
    note,
    category: item.category,
    targets: item.lists,
    newName: '',
    photo: item.photo ? { id: item.photo } : null,
    link,
  };
}
