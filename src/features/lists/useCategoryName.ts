import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n';
import { checklistGroups } from '../checklist/items';
import { isCategoryKey, isTranslatedCategory, type List } from './lists';

/**
 * A category's name: a before-the-flight group or one of a list's own (translated), or ours;
 * no category is "Other".
 * Another list's key too when an item in several lists brought it along.
 */
export function useCategoryName(list: List) {
  const { t } = useTranslation();
  const lang = useLanguage();
  return (category: string) => {
    if (!category) return t('lists.noCategory');
    if (!isTranslatedCategory(list, category)) return category;
    const group = checklistGroups.find((each) => each.id === category);
    if (group) return group.title[lang];
    return isCategoryKey(category) ? t(`lists.categories.${category}`) : category;
  };
}
