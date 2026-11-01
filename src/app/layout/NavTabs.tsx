import { useTranslation } from 'react-i18next';
import { navItems, type NavId } from '../navigation';

/**
 * The seven tabs, shared by the phone tab bar and the desktop side rail. The highlight fades
 * between tabs in CSS, so the same elements stay mounted and can transition.
 */
export function NavTabs({ active }: { active: NavId }) {
  const { t } = useTranslation();
  return navItems.map(({ id, Icon, href }) => (
    <a key={id} href={href()} className="nav-tab" aria-current={id === active ? 'page' : undefined}>
      <span className="nav-pip">
        <Icon size={24} />
      </span>
      {t(`nav.items.${id}`)}
    </a>
  ));
}
