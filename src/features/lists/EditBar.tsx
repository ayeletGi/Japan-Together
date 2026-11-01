import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** An edit form's top bar: its title, then ✗ (cancel) and ✓ (the form's submit). */
export function EditBar({ title, onCancel }: { title: string; onCancel: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="list-edit-bar">
      <h3 className="list-edit-title">{title}</h3>
      <button
        type="button"
        className="round-button list-action"
        aria-label={t('lists.cancel')}
        onClick={onCancel}
      >
        <X size={18} strokeWidth={2.6} aria-hidden="true" />
      </button>
      <button
        type="submit"
        className="round-button list-action list-save"
        aria-label={t('lists.save')}
      >
        <Check size={20} strokeWidth={2.6} aria-hidden="true" />
      </button>
    </div>
  );
}
