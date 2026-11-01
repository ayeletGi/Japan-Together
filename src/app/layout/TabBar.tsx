import { useTranslation } from 'react-i18next';
import type { NavId } from '../navigation';
import { NavTabs } from './NavTabs';

/** The frosted tab bar at the bottom of the phone screen (hidden on desktop by CSS). */
export function TabBar({ active }: { active: NavId }) {
  const { t } = useTranslation();
  return (
    <nav className="tab-bar" aria-label={t('nav.main')}>
      <NavTabs active={active} />
    </nav>
  );
}
