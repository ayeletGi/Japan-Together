import { useTranslation } from 'react-i18next';
import { CatMark } from '../../components/icons';
import type { NavId } from '../navigation';
import { NavTabs } from './NavTabs';

/** The sticky side rail with the brand and the tabs, on desktop only. */
export function SideRail({ active }: { active: NavId }) {
  const { t } = useTranslation();
  return (
    <nav className="side-rail" aria-label={t('nav.main')}>
      <div className="side-rail-brand">
        <CatMark size={30} />
        {t('app.name')}
      </div>
      <NavTabs active={active} />
    </nav>
  );
}
