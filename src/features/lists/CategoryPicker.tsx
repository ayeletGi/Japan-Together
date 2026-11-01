import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryChoices, type List } from './lists';
import { useCategoryName } from './useCategoryName';

/** Chips to pick a category, "Other" (or the picked one again) for none, or "+ New" to type one. */
export function CategoryPicker({
  list,
  value,
  onChange,
}: {
  list: List;
  value: string;
  onChange: (category: string) => void;
}) {
  const { t } = useTranslation();
  const name = useCategoryName(list);
  const choices = categoryChoices(list);
  // Typing a new one: the field holds the category itself, so saving always has what was typed.
  const [typing, setTyping] = useState(false);
  const shown = !typing && value && !choices.includes(value) ? [...choices, value] : choices;
  return (
    <fieldset className="list-categories">
      <legend className="muted">{t('lists.category')}</legend>
      <div className="chip-row">
        <button
          type="button"
          className="chip"
          aria-pressed={!typing && !value}
          onClick={() => {
            setTyping(false);
            onChange('');
          }}
        >
          {name('')}
        </button>
        {shown.map((category) => (
          <button
            type="button"
            key={category}
            className="chip"
            aria-pressed={!typing && value === category}
            onClick={() => {
              setTyping(false);
              onChange(value === category && !typing ? '' : category);
            }}
          >
            {name(category)}
          </button>
        ))}
        <NewChip
          typing={typing}
          inputLabel={t('lists.newCategory')}
          placeholder={t('lists.newCategoryPlaceholder')}
          maxLength={60}
          value={value}
          onChange={onChange}
          onStart={() => {
            onChange('');
            setTyping(true);
          }}
          onDone={() => setTyping(false)}
        />
      </div>
    </fieldset>
  );
}

/** A "+ New" chip that turns into a field to type the new one; Enter or leaving it closes it. */
export function NewChip({
  typing,
  inputLabel,
  placeholder,
  maxLength,
  value,
  onChange,
  onStart,
  onDone,
  inputProps,
}: {
  typing: boolean;
  inputLabel: string;
  placeholder: string;
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
  onStart: () => void;
  onDone: () => void;
  inputProps?: { lang?: string; dir?: 'rtl' | 'ltr' };
}) {
  const { t } = useTranslation();
  if (!typing) {
    return (
      <button type="button" className="chip list-new-chip" onClick={onStart}>
        <Plus size={14} aria-hidden="true" />
        {t('lists.newChip')}
      </button>
    );
  }
  return (
    <input
      className="input list-category-input"
      aria-label={inputLabel}
      placeholder={placeholder}
      maxLength={maxLength}
      value={value}
      autoFocus
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        // Enter keeps what was typed instead of sending the form.
        if (event.key === 'Enter') {
          event.preventDefault();
          onDone();
        }
      }}
      onBlur={onDone}
      {...inputProps}
    />
  );
}
