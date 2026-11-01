import { Dumbbell, ShoppingBag, Utensils, WashingMachine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { discoverTabs, paths, type DiscoverTab } from '../../app/router';
import { ExternalLink } from '../../components/ExternalLink';
import { MapsLogo } from '../../components/MapsLogo';
import { FOOD_MAP_URL } from '../../data/dining';
import { getDay } from '../../data/trip';
import { placeName, useLanguage } from '../../i18n';
import { formatWeekdayDayMonth } from '../../lib/dates';
import { DayChips } from '../itinerary/DayChips';
import { FoodTab } from './FoodTab';
import { GymsTab } from './GymsTab';
import { LaundryTab } from './LaundryTab';
import { ShoppingTab } from './ShoppingTab';
import './discover.css';

const tabIcons = {
  food: Utensils,
  shopping: ShoppingBag,
  gyms: Dumbbell,
  laundry: WashingMachine,
};

/**
 * Discover: a page title like the other tabs (the chosen day as its kicker), four shop tiles
 * with striped awnings (food, shopping, gyms, laundry), the "which day?" chips, then that
 * category's own filters and calm place cards.
 */
export function DiscoverPage({
  tab,
  date,
  eventId,
}: {
  tab: DiscoverTab;
  date?: string;
  eventId?: string;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const day = date ? getDay(date) : undefined;
  return (
    <div className="wrap discover">
      <header className="discover-head">
        <div>
          <p className="discover-kicker">
            {day
              ? `${formatWeekdayDayMonth(day.date, lang)} · ${placeName(day.city, t)}`
              : t('discover.kicker')}
          </p>
          <h1>{t('discover.title')}</h1>
        </div>
        {tab === 'food' && (
          <ExternalLink className="btn btn--small" href={FOOD_MAP_URL}>
            <MapsLogo size={16} />
            {t('food.ourMap')}
          </ExternalLink>
        )}
      </header>

      <div className="shops" role="group" aria-label={t('discover.tabsLabel')}>
        {discoverTabs.map((id) => {
          const Icon = tabIcons[id];
          return (
            <button
              type="button"
              key={id}
              className={`shop shop--${id}`}
              aria-pressed={id === tab}
              onClick={() => {
                window.location.hash = paths.discover(id, { date });
              }}
            >
              <span className="shop-awning" aria-hidden="true" />
              <span className="shop-scallop" aria-hidden="true" />
              <span className="shop-front">
                <Icon size={22} aria-hidden="true" />
                {t(`discover.tabs.${id}`)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="discover-days">
        <span className="filter-label">{t('food.forDay')}</span>
        <DayChips
          selected={date}
          href={(value) => paths.discover(tab, { date: value })}
          label={t('food.forDay')}
          all={{ href: paths.discover(tab), label: t('food.allDays') }}
        />
      </div>

      {tab === 'food' && <FoodTab key={`${date}-${eventId}`} date={date} eventId={eventId} />}
      {tab === 'shopping' && <ShoppingTab key={date} date={date} />}
      {tab === 'gyms' && <GymsTab key={date} date={date} />}
      {tab === 'laundry' && <LaundryTab date={date} />}
    </div>
  );
}
