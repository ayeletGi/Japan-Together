import { ArrowUpLeft, Clock, ShoppingBag, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { ExternalLink } from '../../components/ExternalLink';
import { MoreLinks } from '../../components/MoreLinks';
import { Pill } from '../../components/Pill';
import { SourceCheckNote } from '../../components/SourceCheckNote';
import { routeFor } from '../../data/routes';
import {
  shopCategories,
  shopCategory,
  shoppingDays,
  shoppingLinks,
  type ShopCategory,
  type ShoppingDay,
} from '../../data/shopping';
import { useContentProps, useLanguage } from '../../i18n';
import { formatWeekdayDayMonth } from '../../lib/dates';
import { directionsUrl } from '../../lib/maps';
import { FilterRow } from './FilterRow';
import { PlaceCard, PlaceFact } from './PlaceCard';
import { usePlanMatch } from './usePlanMatch';

const TOP_PICKS = 3;

type CategoryChoice = 'all' | ShopCategory;

function ShoppingDaySection({
  day,
  category,
  inPlan,
}: {
  day: ShoppingDay;
  category: CategoryChoice;
  inPlan: (name: string) => boolean;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const content = useContentProps();
  const [showAll, setShowAll] = useState(false);
  // Keep each pick's place in the day, so the first one stays "my pick" when filtering.
  const ranked = day.picks.map((pick, index) => ({ pick, index }));
  const matching =
    category === 'all' ? ranked : ranked.filter(({ pick }) => shopCategory(pick) === category);
  const picks = showAll || category !== 'all' ? matching : matching.slice(0, TOP_PICKS);
  const start = routeFor(day.date)?.start.query;

  return (
    <section className="shopping-day" aria-labelledby={`shop-${day.date}`}>
      <header className="shopping-day-head">
        <div>
          <span className="shopping-day-date">{formatWeekdayDayMonth(day.date, lang)}</span>
          <h2 id={`shop-${day.date}`}>
            <bdi>{day.area}</bdi>
          </h2>
        </div>
        <a className="text-link" href={paths.day(day.date)}>
          {t('shopping.toDay')}
        </a>
      </header>
      <p className="discover-note" {...content}>
        <Star size={15} aria-hidden="true" />
        <span>{day.focus}</span>
      </p>
      <div className="places">
        {picks.map(({ pick, index }) => {
          const onRoute = inPlan(pick.name);
          return (
            <PlaceCard
              key={pick.name}
              icon={<ShoppingBag size={24} />}
              tone="lav"
              name={pick.name}
              text={pick.why}
              highlight={onRoute}
              mapsHref={directionsUrl({
                origin: start,
                destination: pick.mapsQuery,
                mode: 'transit',
              })}
              facts={
                <PlaceFact icon={<Clock size={13} aria-hidden="true" />}>{pick.hours}</PlaceFact>
              }
              pills={
                <>
                  <Pill tone="gray">
                    <bdi {...content}>{pick.kind}</bdi>
                  </Pill>
                  {index === 0 && <Pill tone="sun">{t('shopping.myPick')}</Pill>}
                  {index > 0 && pick.starred && (
                    <Pill tone="sun">{t('shopping.alsoRecommended')}</Pill>
                  )}
                  {onRoute && <Pill tone="pink">{t('discover.onRoute')}</Pill>}
                </>
              }
            >
              {pick.check && <SourceCheckNote check={pick.check} />}
              <div className="place-links">
                <ExternalLink className="text-link" href={pick.website}>
                  {t('shopping.website')}
                  <ArrowUpLeft size={14} className="flip-ltr" />
                </ExternalLink>
              </div>
            </PlaceCard>
          );
        })}
      </div>
      {category === 'all' && day.picks.length > TOP_PICKS && (
        <button type="button" className="btn discover-more" onClick={() => setShowAll(!showAll)}>
          {showAll
            ? t('shopping.showLess')
            : t('shopping.showMore', { count: day.picks.length - TOP_PICKS })}
        </button>
      )}
      {day.hours.length > 0 && (
        <details className="place-more hours-table">
          <summary>{t('shopping.hoursTitle')}</summary>
          <ul {...content}>
            {day.hours.map((entry) => (
              <li key={entry.name}>
                <strong>
                  <bdi>{entry.name}</bdi>
                </strong>{' '}
                <span dir="auto">{entry.hours}</span>
                {entry.note && <small> · {entry.note}</small>}{' '}
                <ExternalLink className="inline-link" href={entry.website}>
                  {t('shopping.source')}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function ShoppingTab({ date }: { date?: string }) {
  const { t } = useTranslation();
  const inPlan = usePlanMatch(date);
  const selected = date ? shoppingDays.filter((day) => day.date === date) : [];
  const [category, setCategory] = useState<CategoryChoice>('all');
  const days = selected.length ? selected : shoppingDays;
  const list =
    category === 'all'
      ? days
      : days.filter((day) => day.picks.some((pick) => shopCategory(pick) === category));
  const shown = list.flatMap((day) =>
    day.picks.filter((pick) => category === 'all' || shopCategory(pick) === category),
  ).length;
  const pool = days.flatMap((day) => day.picks);
  return (
    <div className="discover-panel">
      <div className="discover-filters">
        <FilterRow
          label={t('shopping.categoryFilter')}
          value={category}
          onChange={setCategory}
          options={(['all', ...shopCategories] as const)
            .map((value) => ({
              value,
              label: t(`shopping.categories.${value}`),
              count:
                value === 'all'
                  ? pool.length
                  : pool.filter((pick) => shopCategory(pick) === value).length,
            }))
            .filter((option) => option.value === 'all' || option.count > 0)}
        />
      </div>
      <p className="discover-note">{t('shopping.intro')}</p>
      {date && selected.length === 0 && (
        <p className="discover-note">{t('shopping.noneThatDay')}</p>
      )}
      <p className="filter-status" aria-live="polite">
        {t('shopping.showing', { days: list.length, count: shown })}
      </p>
      {list.map((day) => (
        <ShoppingDaySection key={day.date} day={day} category={category} inPlan={inPlan} />
      ))}
      {list.length === 0 && <p className="discover-empty">{t('shopping.empty')}</p>}
      {selected.length > 0 && (
        <a className="btn discover-more" href={paths.discover('shopping')}>
          {t('shopping.allDays', { count: shoppingDays.length })}
        </a>
      )}
      <MoreLinks links={shoppingLinks} />
      <p className="small-note">{t('shopping.footer')}</p>
    </div>
  );
}
