import { ArrowUpLeft, CalendarCheck, Clock, Info, MapPin, Star, Utensils } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { Card } from '../../components/Card';
import { ExternalLink } from '../../components/ExternalLink';
import { MoreLinks } from '../../components/MoreLinks';
import { Pill } from '../../components/Pill';
import { SourceCheckNote } from '../../components/SourceCheckNote';
import {
  citiesIn,
  dayZones,
  diningLinks,
  proximity,
  restaurantForEvent,
  restaurants,
  zoneCity,
  zoneNames,
  type CityId,
  type FoodType,
  type Restaurant,
  type ZoneId,
} from '../../data/dining';
import { routeFor } from '../../data/routes';
import { getDay, getEvent } from '../../data/trip';
import { useContentProps, useLanguage } from '../../i18n';
import { formatDayMonth, formatWeekdayDayMonth } from '../../lib/dates';
import { directionsUrl } from '../../lib/maps';
import { eventDisplay } from '../itinerary/eventDisplay';
import { FilterRow } from './FilterRow';
import { PlaceCard, PlaceFact } from './PlaceCard';
import { rankRestaurants, type SortChoice } from './ranking';
import { usePlanMatch } from './usePlanMatch';

type CityChoice = 'all' | CityId;

const allCities: CityId[] = ['tokyo', 'kobe', 'osaka', 'kyoto'];
type TypeChoice = 'all' | FoodType;

function RestaurantCard({
  restaurant,
  zone,
  origin,
  planned,
  onRoute,
}: {
  restaurant: Restaurant;
  zone?: ZoneId;
  origin?: string;
  planned: boolean;
  onRoute: boolean;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const content = useContentProps();
  const near = proximity(restaurant, zone);
  const mode = near === 'same' ? 'walking' : 'transit';
  return (
    <PlaceCard
      icon={<Utensils size={24} />}
      tone="pink"
      name={restaurant.name}
      text={restaurant.food}
      highlight={planned || onRoute}
      mapsHref={directionsUrl({ origin, destination: restaurant.mapsQuery, mode })}
      facts={
        <>
          <PlaceFact icon={<MapPin size={13} aria-hidden="true" />}>
            <bdi>{zoneNames[restaurant.zone]}</bdi>
            {zone && <> · {t(`food.proximity.${near}`)}</>}
          </PlaceFact>
          <PlaceFact icon={<Clock size={13} aria-hidden="true" />}>{restaurant.hours}</PlaceFact>
          {restaurant.rating !== null && (
            <PlaceFact icon={<Star size={13} aria-hidden="true" />}>
              <span className="num">{restaurant.rating}</span>
            </PlaceFact>
          )}
        </>
      }
      pills={
        <>
          <Pill tone="gray">{t(`food.types.${restaurant.type}`)}</Pill>
          {restaurant.booked && (
            <Pill tone="mint" icon={<CalendarCheck size={13} aria-hidden="true" />}>
              {t('food.booked')}
            </Pill>
          )}
          {planned && !restaurant.booked && <Pill tone="pink">{t('food.plannedHere')}</Pill>}
          {onRoute && !planned && <Pill tone="pink">{t('discover.onRoute')}</Pill>}
        </>
      }
    >
      {restaurant.booked && (
        <p className="small-note" {...content}>
          {restaurant.booked}
        </p>
      )}
      {restaurant.check && <SourceCheckNote check={restaurant.check} />}
      <details className="place-more">
        <summary>{t('discover.moreDetails')}</summary>
        <ul {...content}>
          {restaurant.plannerHours && (
            <li>
              {t('food.plannerHours')} {restaurant.plannerHours.hours} ·{' '}
              {restaurant.plannerHours.note}
            </li>
          )}
          <li>
            {restaurant.rating !== null
              ? t('food.rating', { rating: restaurant.rating })
              : t('food.noRating')}
          </li>
          <li>
            {t('food.price')} {t('food.priceUnknown')}
          </li>
          {restaurant.eventIds.length > 0 && (
            <li>
              {t('food.inPlan')}{' '}
              {restaurant.eventIds.map((id, index) => {
                const event = getEvent(id);
                if (!event) return null;
                return (
                  <span key={id}>
                    {index > 0 && ' · '}
                    <a className="inline-link" href={paths.day(event.date)}>
                      {formatDayMonth(event.date, lang)}
                      {event.time ? ` ${event.time}` : ''}
                    </a>
                  </span>
                );
              })}
            </li>
          )}
        </ul>
        <div className="place-links">
          <ExternalLink className="text-link" href={restaurant.website}>
            {t('food.website')}
            <ArrowUpLeft size={14} className="flip-ltr" />
          </ExternalLink>
          {restaurant.plannerHours && restaurant.plannerHours.link !== restaurant.website && (
            <ExternalLink className="text-link" href={restaurant.plannerHours.link}>
              {t('food.checkHours')}
              <ArrowUpLeft size={14} className="flip-ltr" />
            </ExternalLink>
          )}
        </div>
      </details>
    </PlaceCard>
  );
}

export function FoodTab({ date, eventId }: { date?: string; eventId?: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const content = useContentProps();
  const meal = eventId ? getEvent(eventId) : undefined;
  const mealDate = meal?.date ?? date;
  const planned = meal ? restaurantForEvent(meal.id) : undefined;
  const zone: ZoneId | undefined = planned?.zone ?? (mealDate ? dayZones[mealDate] : undefined);
  const zoneCityId = zone ? zoneCity[zone] : undefined;
  const contextCity: CityChoice = zoneCityId && zoneCityId !== 'disney' ? zoneCityId : 'all';
  const inPlan = usePlanMatch(mealDate);
  // A picked day already says the city: one city needs no filter, a travel day offers its two.
  const dayCities = mealDate ? citiesIn(getDay(mealDate)?.city ?? '') : [];
  if (planned && dayCities.length > 0 && !dayCities.includes(planned.city)) {
    dayCities.push(planned.city);
  }
  const cityOptions: CityChoice[] = dayCities.length > 0 ? dayCities : ['all', ...allCities];
  const startCity = cityOptions.includes(contextCity) ? contextCity : cityOptions[0];

  const [city, setCity] = useState<CityChoice>(startCity);
  const [type, setType] = useState<TypeChoice>('all');
  const [sort, setSort] = useState<SortChoice>('nearby');

  const origin = meal?.place ?? (mealDate ? routeFor(mealDate)?.start.query : undefined);
  const list = rankRestaurants(
    restaurants.filter(
      (restaurant) =>
        (city === 'all' || restaurant.city === city) &&
        (type === 'all' || restaurant.type === type),
    ),
    zone,
    sort,
    planned?.id,
  );
  const onRoute = (restaurant: Restaurant) =>
    !!mealDate &&
    (restaurant.eventIds.some((id) => getEvent(id)?.date === mealDate) || inPlan(restaurant.name));
  const disneyDay = zone === 'maihama';

  return (
    <div className="discover-panel">
      {meal && (
        <Card ears className="discover-context" {...content}>
          <small>{t('food.alternativesFor')}</small>
          <strong>{eventDisplay(meal).title}</strong>
          <span className="muted">
            {formatWeekdayDayMonth(meal.date, lang)}
            {meal.time ? ` · ${meal.time}` : ''}
            {zone ? ` · ${zoneNames[zone]}` : ''}
          </span>
          <a className="text-link" href={paths.day(meal.date)}>
            {t('common.backToDay')}
          </a>
        </Card>
      )}

      <div className="discover-filters">
        {cityOptions.length > 1 && (
          <FilterRow
            label={t('food.cityFilter')}
            value={city}
            onChange={setCity}
            options={cityOptions.map((value) => ({
              value,
              label: t(`food.cities.${value}`),
              count:
                value === 'all'
                  ? restaurants.length
                  : restaurants.filter((restaurant) => restaurant.city === value).length,
            }))}
          />
        )}
        <FilterRow
          label={t('food.typeFilter')}
          value={type}
          onChange={setType}
          options={(['all', 'ramen', 'sushi', 'japanese', 'cafe', 'burger', 'other'] as const).map(
            (value) => ({
              value,
              label: value === 'all' ? t('food.allTypes') : t(`food.types.${value}`),
            }),
          )}
        />
        <FilterRow
          label={t('food.sort')}
          value={sort}
          onChange={setSort}
          options={[
            { value: 'nearby', label: t('food.sortNearby') },
            { value: 'rating', label: t('food.sortRating') },
          ]}
        />
      </div>

      <p className="discover-note">
        <Info size={15} aria-hidden="true" />
        <span>{t('food.rule')}</span>
      </p>
      {disneyDay && <p className="discover-note">{t('food.disneyNote')}</p>}

      <p className="filter-status" aria-live="polite">
        {t('food.showing', { count: list.length, total: restaurants.length })}
      </p>
      <div className="places">
        {list.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            zone={zone}
            origin={origin}
            planned={restaurant.id === planned?.id}
            onRoute={onRoute(restaurant)}
          />
        ))}
      </div>
      {list.length === 0 && <p className="discover-empty">{t('food.empty')}</p>}
      <MoreLinks links={diningLinks} />
      <p className="small-note">{t('food.footer')}</p>
    </div>
  );
}
