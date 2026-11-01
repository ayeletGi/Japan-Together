import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** "Something else": a free-text place or activity, added or swapped in by us. */
export function CustomStopForm({
  submitLabel,
  onSubmit,
}: {
  submitLabel: string;
  onSubmit: (title: string) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [title, setTitle] = useState('');
  return (
    <form
      className="custom-stop"
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim()) onSubmit(title.trim());
      }}
    >
      <label className="muted" htmlFor={id}>
        {t('edit.other')}
      </label>
      <input
        id={id}
        className="input"
        value={title}
        placeholder={t('edit.otherPlaceholder')}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <button type="submit" className="btn btn--primary btn--wide">
        {submitLabel}
      </button>
    </form>
  );
}
