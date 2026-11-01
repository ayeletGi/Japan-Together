import { ArrowUpLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MoreLink } from '../data/types';
import { useContentProps } from '../i18n';
import { ExternalLink } from './ExternalLink';

/** Curated outside lists for finding more places than the app shows. */
export function MoreLinks({ links }: { links: MoreLink[] }) {
  const { t } = useTranslation();
  const content = useContentProps();
  return (
    <section className="more-links" aria-labelledby="more-links-title">
      <h2 id="more-links-title">{t('discover.moreLinks')}</h2>
      <ul {...content}>
        {links.map((link) => (
          <li key={link.url}>
            <ExternalLink className="text-link" href={link.url}>
              <bdi>{link.label}</bdi>
              <ArrowUpLeft size={14} />
            </ExternalLink>
            <small>{link.note}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
