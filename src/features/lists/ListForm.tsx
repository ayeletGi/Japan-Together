import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LIST_OWNERS, type ListOwner } from '../../../shared/liveSchema';
import { EditBar } from './EditBar';

/** A list's name and whose it is: the new-list form, and the ✏️ on a list's title. */
export function ListForm({
  id,
  title,
  name: startName = '',
  owner: startOwner,
  onSave,
  onCancel,
}: {
  /** The name field's id, for a section named by it. */
  id?: string;
  title: string;
  name?: string;
  /** For a new list, the group picked above. */
  owner: ListOwner;
  onSave: (name: string, owner: ListOwner) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const ownId = useId();
  const nameId = id ?? ownId;
  const [name, setName] = useState(startName);
  const [owner, setOwner] = useState(startOwner);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="card list-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim() || busy) return;
        setBusy(true);
        await onSave(name, owner);
        setBusy(false);
      }}
    >
      <EditBar title={title} onCancel={onCancel} />
      <label className="muted" htmlFor={nameId}>
        {t('lists.listName')}
      </label>
      <input
        id={nameId}
        className="input"
        value={name}
        maxLength={200}
        placeholder={t('lists.listNamePlaceholder')}
        autoFocus
        onChange={(event) => setName(event.target.value)}
      />
      <fieldset className="list-categories">
        <legend className="muted">{t('lists.owner')}</legend>
        <div className="chip-row">
          {LIST_OWNERS.map((each) => (
            <button
              type="button"
              key={each}
              className="chip"
              aria-pressed={owner === each}
              onClick={() => setOwner(each)}
            >
              {t(`lists.groups.${each}`)}
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
