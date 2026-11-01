import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActionRow } from '../../components/ActionRow';
import { categoryIcons } from './eventDisplay';
import { stopTone } from './stopLook';
import type { Suggestion } from './suggestions';

/** Discover's picks for the day, each one tap away from the plan. */
export function SuggestionList({
  suggestions,
  onPick,
}: {
  suggestions: Suggestion[];
  onPick: (suggestion: Suggestion) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <h3 className="sheet-subtitle">{t('edit.suggestions')}</h3>
      {suggestions.length ? (
        <div className="action-list">
          {suggestions.map((suggestion) => {
            const Icon = categoryIcons[suggestion.kind];
            return (
              <ActionRow
                key={suggestion.id}
                icon={<Icon size={18} />}
                tone={stopTone({ category: suggestion.kind })}
                title={<bdi>{suggestion.title}</bdi>}
                sub={<bdi>{suggestion.note}</bdi>}
                trailing={<Plus size={16} className="action-row-end" aria-hidden="true" />}
                onClick={() => onPick(suggestion)}
              />
            );
          })}
        </div>
      ) : (
        <p className="muted">{t('edit.noSuggestions')}</p>
      )}
    </>
  );
}
