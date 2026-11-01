import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { ProgressBar } from '../../components/ProgressBar';
import { SectionTitle } from '../../components/SectionTitle';
import type { Save } from '../../hooks/useSave';
import { saveListEntries } from '../../lib/liveEdit';
import { LIST_OWNERS, type ListOwner } from '../../../shared/liveSchema';
import { useCategoryName } from './useCategoryName';
import { ItemRow, type Draft } from './ItemRow';
import { GroupCats } from './ListGroups';
import { ListForm } from './ListForm';
import {
  FLIGHT_LIST,
  isGiftList,
  listProgress,
  listSections,
  removeList,
  renameList,
  searchItems,
  type Item,
  type List,
} from './lists';

export function ListView({
  list,
  lists,
  listName,
  fullName,
  locked,
  save,
  onLocked,
  onAdd,
  onMove,
}: {
  list: List;
  lists: List[];
  listName: (list: List) => string;
  /** The name with whose list it is, where lists are named side by side. */
  fullName: (list: List) => string;
  locked: boolean;
  save: Save;
  onLocked: () => void;
  /** Opens the add form with this category picked. */
  onAdd: (category: string) => void;
  /** Moves the list to another of us (renamed too, if `name` is given); says whether it saved. */
  onMove: (owner: ListOwner, name?: string) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const name = listName(list);
  const categoryName = useCategoryName(list);
  // The title's ✏️ opens its name and whose it is, ⇄ the other groups to move it to; 🗑 asks first.
  const [titleMode, setTitleMode] = useState<'view' | 'edit' | 'move' | 'confirm'>('view');
  const gifts = isGiftList(list.preset);
  const { done, total } = listProgress(list);
  const titleId = `list-${list.id}`;
  const sections = listSections(list);
  // An edit whose save failed, by item: its row may have gone and come back meanwhile (a move
  // shows the item in the other list until the server says no), so the typing is kept here.
  const [failed, setFailed] = useState<Record<string, Draft>>({});
  const keepFailed = (id: string, draft?: Draft) =>
    setFailed((all) => {
      const next = { ...all };
      if (draft) next[id] = draft;
      else delete next[id];
      return next;
    });
  // Categories show what is left to do; everything done waits folded under one "✓ 17 done"
  // toggle at the bottom of the list, in a single run with no category headings.
  const [showDone, setShowDone] = useState(false);
  // A search shows every match, open or done, in one run with no category headings.
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const found = searching ? searchItems(list, query, categoryName) : [];
  const doneItems = sections.flatMap((section) => section.items.filter((item) => item.done));
  const rows = (items: Item[]) => (
    <ul className="todo-list list-items">
      {items.map((item) => (
        <ItemRow
          key={item.id}
          list={list}
          lists={lists}
          listName={fullName}
          item={item}
          gifts={gifts}
          locked={locked}
          save={save}
          onLocked={onLocked}
          failed={failed[item.id]}
          onFailed={(draft) => keepFailed(item.id, draft)}
        />
      ))}
    </ul>
  );

  return (
    <section aria-labelledby={titleId}>
      {titleMode === 'edit' ? (
        <ListForm
          id={titleId}
          title={t('lists.editListTitle')}
          name={name}
          owner={list.owner}
          onCancel={() => setTitleMode('view')}
          onSave={async (newName, owner) => {
            // Saving failed: the form stays open with what was typed.
            const saved =
              owner !== list.owner
                ? await onMove(owner, newName.trim() === name ? undefined : newName)
                : newName.trim() === name ||
                  (await save(() => saveListEntries('lists', renameList(list.id, newName))));
            if (saved) setTitleMode('view');
          }}
        />
      ) : (
        <SectionTitle
          id={titleId}
          action={
            !locked && (
              <div className="list-title-actions">
                {titleMode === 'confirm' ? (
                  <>
                    <button
                      type="button"
                      className="btn btn--small btn--danger"
                      autoFocus
                      onClick={async () => {
                        if (await save(() => saveListEntries('lists', removeList(list.id))))
                          location.hash = paths.lists(FLIGHT_LIST);
                        else setTitleMode('view');
                      }}
                    >
                      {t('lists.confirmDeleteList', { name })}
                    </button>
                    <button
                      type="button"
                      className="round-button list-action list-title-action"
                      aria-label={t('lists.cancel')}
                      onClick={() => setTitleMode('view')}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="round-button list-action list-title-action"
                      aria-label={t('lists.moveList')}
                      aria-expanded={titleMode === 'move'}
                      onClick={() => setTitleMode(titleMode === 'move' ? 'view' : 'move')}
                    >
                      <ArrowLeftRight size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="round-button list-action list-title-action"
                      aria-label={t('lists.editList', { name })}
                      onClick={() => setTitleMode('edit')}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    {list.id !== FLIGHT_LIST && (
                      <button
                        type="button"
                        className="round-button list-action list-title-action"
                        aria-label={t('lists.deleteList')}
                        onClick={() => setTitleMode('confirm')}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          }
        >
          {name}{' '}
          {total > 0 && (
            <bdi className="num muted list-count">
              {done}/{total}
            </bdi>
          )}
        </SectionTitle>
      )}
      {titleMode === 'move' && !locked && (
        <div className="card list-move">
          <span className="muted list-move-label">{t('lists.moveList')}</span>
          {LIST_OWNERS.filter((owner) => owner !== list.owner).map((owner) => (
            <button
              type="button"
              key={owner}
              className={`list-group list-group--${owner} list-move-to`}
              aria-label={t('lists.moveListTo', { to: t(`lists.moveTo.${owner}`) })}
              onClick={async () => {
                if (await onMove(owner)) setTitleMode('view');
              }}
            >
              <span className="list-group-seal">
                <GroupCats owner={owner} />
              </span>
              <span className="list-group-name">{t(`lists.groups.${owner}`)}</span>
            </button>
          ))}
        </div>
      )}
      {total === 0 ? (
        <p className="muted">{t('lists.empty')}</p>
      ) : (
        <ProgressBar value={done} max={total} label={name} thin />
      )}

      {total > 0 && (
        <div className="list-search" role="search">
          <Search size={16} aria-hidden="true" className="list-search-icon" />
          <input
            type="search"
            className="input list-search-input"
            value={query}
            placeholder={t('lists.searchPlaceholder')}
            aria-label={t('lists.search', { name })}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('');
            }}
          />
          {searching && (
            <button
              type="button"
              className="round-button list-action list-search-clear"
              aria-label={t('lists.clearSearch')}
              onClick={() => setQuery('')}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {searching &&
        (found.length > 0 ? (
          <>
            <p className="muted list-search-count" aria-live="polite">
              {t('lists.searchCount', { count: found.length })}
            </p>
            {rows(found)}
          </>
        ) : (
          <p className="muted list-search-count" aria-live="polite">
            {t('lists.searchNone', { query: query.trim() })}
          </p>
        ))}

      {!searching &&
        sections.map((section) => {
          const progress = listProgress({ ...list, items: section.items });
          // A list with no categories at all needs no "Other" heading.
          const titled = section.category || sections.length > 1;
          return (
            // Prefixed, so a category typed as "-" never shares a key with the uncategorised one.
            <div key={`category:${section.category}`}>
              {titled && (
                <div className="list-category-head">
                  <h3 className="todo-group list-category">
                    {categoryName(section.category)}{' '}
                    <bdi className="num muted list-count">
                      {progress.done}/{progress.total}
                    </bdi>
                  </h3>
                  <button
                    type="button"
                    className="round-button list-action list-category-add"
                    aria-label={t('lists.addTo', { name: categoryName(section.category) })}
                    onClick={() => onAdd(section.category)}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
              {rows(section.items.filter((item) => !item.done))}
            </div>
          );
        })}
      {!searching && doneItems.length > 0 && (
        <>
          <button
            type="button"
            className="list-done-toggle"
            aria-expanded={showDone}
            onClick={() => setShowDone((shown) => !shown)}
          >
            <Check size={14} aria-hidden="true" />
            {t('lists.doneCount', { count: doneItems.length })} ·{' '}
            {showDone ? t('lists.hideDone') : t('lists.showDone')}
            {showDone ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </button>
          {showDone && rows(doneItems)}
        </>
      )}
    </section>
  );
}
