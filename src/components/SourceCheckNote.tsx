import { BadgeCheck, CircleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SourceCheck } from '../data/types';
import { useContentProps, useLanguage } from '../i18n';
import { formatDayMonth } from '../lib/dates';
import { ExternalLink } from './ExternalLink';

/** "Checked on <date> at <source>" for places added after the original plan. */
export function SourceCheckNote({ check }: { check: SourceCheck }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const content = useContentProps();
  const Icon = check.official ? BadgeCheck : CircleAlert;
  return (
    <p className={`source-check ${check.official ? 'official' : 'listing'}`}>
      <Icon size={14} />
      <span>
        {t(check.official ? 'discover.checkedOfficial' : 'discover.checkedListing', {
          date: formatDayMonth(check.date, lang),
        })}{' '}
        <ExternalLink className="inline-link" href={check.link}>
          {check.source ? (
            <bdi {...content}>{check.source}</bdi>
          ) : (
            <bdi>{t('discover.officialSite')}</bdi>
          )}
        </ExternalLink>
      </span>
    </p>
  );
}
