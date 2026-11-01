import { Check } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Save } from '../../hooks/useSave';
import { saveListEntries } from '../../lib/liveEdit';
import { CategoryPicker } from './CategoryPicker';
import { LinkField, PhotoField } from './ItemExtras';
import { savePhoto, type PhotoChoice } from './itemPhoto';
import { isGiftList, newItem, type List } from './lists';

/**
 * The + sheet's form: it stays open after each add, so a few items go in one after another. The
 * category stays picked between them. Each add is confirmed inside the sheet (a line naming what went
 * in, and a moment of "added" on the button): a bottom toast would sit under the button or the keyboard.
 */
export function AddItemForm({
  list,
  startCategory,
  save,
}: {
  list: List;
  startCategory: string;
  save: Save;
}) {
  const { t } = useTranslation();
  const textId = useId();
  const noteId = useId();
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState(startCategory);
  const [photo, setPhoto] = useState<PhotoChoice>(null);
  const [link, setLink] = useState('');
  const [added, setAdded] = useState<{ name: string; count: number; at: number } | null>(null);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!added) return;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 1400);
    return () => window.clearTimeout(timer);
  }, [added]);
  const gifts = isGiftList(list.preset);
  const placeholder =
    list.preset === 'flight' || list.preset === 'pack' ? list.preset : ('custom' as const);
  return (
    <form
      className="list-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!text.trim() && !note.trim()) return;
        const typed = { text, note, photo, link };
        setText('');
        setNote('');
        setPhoto(null);
        setLink('');
        document.getElementById(textId)?.focus();
        const saved = await save(async () => {
          const photoId = await savePhoto(typed.photo);
          const entries = newItem(list.id, {
            text: text || note,
            note: text ? note : '',
            category,
            photo: photoId,
            link: typed.link,
          });
          await saveListEntries('listItems', entries);
        });
        // Saving failed: give back what was typed, unless something new was typed since.
        if (saved) {
          setAdded((now) => ({
            name: (typed.text || typed.note).trim(),
            count: (now?.count ?? 0) + 1,
            at: Date.now(),
          }));
        } else {
          setText((now) => now || typed.text);
          setNote((now) => now || typed.note);
          setPhoto((now) => now ?? typed.photo);
          setLink((now) => now || typed.link);
        }
      }}
    >
      <p className="list-added" role="status" aria-live="polite">
        {added && (
          <span key={added.at} className="list-added-line">
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
            <span className="list-added-name">{t('lists.addedItem', { name: added.name })}</span>
            {added.count > 1 && (
              <span className="list-added-count">
                {t('lists.addedCount', { count: added.count })}
              </span>
            )}
          </span>
        )}
      </p>
      <label className="muted" htmlFor={textId}>
        {gifts ? t('lists.giftWhat') : t('lists.item')}
      </label>
      <input
        id={textId}
        className="input"
        value={text}
        autoFocus
        placeholder={
          gifts ? t('lists.giftWhatPlaceholder') : t(`lists.itemPlaceholder.${placeholder}`)
        }
        onChange={(event) => setText(event.target.value)}
      />
      <label className="muted" htmlFor={noteId}>
        {gifts ? t('lists.giftFor') : t('lists.note')}
      </label>
      <input
        id={noteId}
        className="input"
        value={note}
        placeholder={gifts ? t('lists.giftForPlaceholder') : ''}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="list-extras">
        <PhotoField value={photo} onChange={setPhoto} />
        <LinkField value={link} onChange={setLink} />
      </div>
      <CategoryPicker list={list} value={category} onChange={setCategory} />
      <button
        type="submit"
        className={`btn btn--primary btn--wide${flash ? ' list-add-done' : ''}`}
      >
        {flash ? t('lists.addedButton') : t('lists.addButton')}
      </button>
    </form>
  );
}
