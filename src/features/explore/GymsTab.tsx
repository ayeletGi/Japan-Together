import { ArrowUpLeft, BadgeCheck, CircleAlert, Clock, Dumbbell, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { ExternalLink } from '../../components/ExternalLink';
import { MoreLinks } from '../../components/MoreLinks';
import { Pill } from '../../components/Pill';
import { SourceCheckNote } from '../../components/SourceCheckNote';
import { gymLinks, gyms, type Gym, type GymAccess, type GymCity } from '../../data/gyms';
import { hotelForMorning, hotelForNight } from '../../data/hotels';
import { useContentProps } from '../../i18n';
import { directionsUrl } from '../../lib/maps';
import { formatShekelsRounded, yenToAgorot } from '../../lib/money';
import { FilterRow } from './FilterRow';
import { PlaceCard, PlaceFact } from './PlaceCard';
import { usePlanMatch } from './usePlanMatch';

type AccessChoice = 'all' | GymAccess;

/** Hotel city (as written in hotels.ts) → gym city; the Disney hotel in Urayasu counts as Tokyo. */
const hotelCities: Record<string, GymCity> = {
  טוקיו: 'tokyo',
  אוראיאסו: 'tokyo',
  קובה: 'kobe',
  אוסקה: 'osaka',
};

const weekOf = (gym: Gym) => gym.week ?? (!gym.date || gym.date >= '2037-11-09' ? 2 : 1);

function GymCard({ gym, date, onRoute }: { gym: Gym; date?: string; onRoute: boolean }) {
  const { t } = useTranslation();
  const content = useContentProps();
  const night = gym.date ?? date;
  const hotel = night ? hotelForNight(night) : undefined;
  const AccessIcon = gym.access === 'unverified' ? CircleAlert : BadgeCheck;
  return (
    <PlaceCard
      icon={<Dumbbell size={24} />}
      tone="mint"
      name={gym.name}
      text={gym.role}
      highlight={onRoute || gym.saturdayNight}
      mapsHref={directionsUrl({
        origin: hotel?.mapsQuery,
        destination: gym.mapsQuery,
        mode: 'transit',
      })}
      facts={
        <>
          <PlaceFact icon={<Clock size={13} aria-hidden="true" />}>{gym.hours}</PlaceFact>
          <PlaceFact icon={<AccessIcon size={13} aria-hidden="true" />}>
            {t(`gyms.access.${gym.access}`)}
          </PlaceFact>
        </>
      }
      pills={
        <>
          <Pill tone="gray">
            {gym.date ? (
              <a href={paths.day(gym.date)}>{gym.dateLabel}</a>
            ) : (
              <bdi {...content}>{gym.dateLabel}</bdi>
            )}
          </Pill>
          {gym.saturdayNight && (
            <Pill tone="lav" icon={<Moon size={12} aria-hidden="true" />}>
              {t('gyms.saturdayNight')}
            </Pill>
          )}
          {onRoute && <Pill tone="pink">{t('discover.onRoute')}</Pill>}
        </>
      }
    >
      {gym.check && <SourceCheckNote check={gym.check} />}
      <details className="place-more">
        <summary>{t('discover.moreDetails')}</summary>
        <ul {...content}>
          <li>
            {t('gyms.price')}{' '}
            {gym.priceJpy === null
              ? t('gyms.priceUnknown')
              : gym.priceJpy === 0
                ? t('gyms.free')
                : t('gyms.priceApprox', { price: formatShekelsRounded(yenToAgorot(gym.priceJpy)) })}
          </li>
          <li>
            {t('gyms.women')} {gym.women}
          </li>
          <li>
            {t('gyms.near')} {gym.near}
          </li>
          <li>{gym.accessNote}</li>
        </ul>
        <div className="place-links">
          <ExternalLink className="text-link" href={gym.website}>
            {t('gyms.website')}
            <ArrowUpLeft size={14} className="flip-ltr" />
          </ExternalLink>
        </div>
      </details>
    </PlaceCard>
  );
}

export function GymsTab({ date }: { date?: string }) {
  const { t } = useTranslation();
  const inPlan = usePlanMatch(date);
  // For a chosen day: that day's planned session, else the gyms in the city we sleep in.
  const stay = date ? (hotelForNight(date) ?? hotelForMorning(date)) : undefined;
  const stayCity = stay ? hotelCities[stay.city] : undefined;
  const planned = date ? gyms.filter((gym) => gym.date === date) : [];
  const nearby = stayCity ? gyms.filter((gym) => gym.city === stayCity) : [];
  const pool = !date ? gyms : planned.length ? planned : nearby.length ? nearby : gyms;
  const [access, setAccess] = useState<AccessChoice>('all');
  const list = pool.filter((gym) => access === 'all' || gym.access === access);
  return (
    <div className="discover-panel">
      <div className="discover-filters">
        <FilterRow
          label={t('gyms.accessFilter')}
          value={access}
          onChange={setAccess}
          options={(['all', 'guests', 'visitor', 'unverified'] as const).map((value) => ({
            value,
            label: t(`gyms.accessChips.${value}`),
            count:
              value === 'all' ? pool.length : pool.filter((gym) => gym.access === value).length,
          }))}
        />
      </div>
      <p className="discover-note">{t('gyms.intro')}</p>
      {date && planned.length === 0 && (
        <p className="discover-note">
          {t(nearby.length ? 'gyms.noneThatDayNearby' : 'gyms.noneThatDay')}
        </p>
      )}
      <p className="filter-status" aria-live="polite">
        {t('gyms.showing', { count: list.length, total: pool.length })}
      </p>
      {([1, 2] as const).map((week) => {
        const weekGyms = list.filter((gym) => weekOf(gym) === week);
        if (weekGyms.length === 0) return null;
        return (
          <section key={week} className="discover-group" aria-labelledby={`gym-week-${week}`}>
            <h2 id={`gym-week-${week}`}>{t('gyms.week', { week })}</h2>
            <div className="places">
              {weekGyms.map((gym) => (
                <GymCard
                  key={gym.id}
                  gym={gym}
                  date={date}
                  onRoute={!!date && (gym.date === date || inPlan(gym.name))}
                />
              ))}
            </div>
          </section>
        );
      })}
      {list.length === 0 && <p className="discover-empty">{t('gyms.empty')}</p>}
      {pool !== gyms && (
        <a className="btn discover-more" href={paths.discover('gyms')}>
          {t('gyms.allGyms', { count: gyms.length })}
        </a>
      )}
      <MoreLinks links={gymLinks} />
      <p className="small-note">{t('gyms.footer')}</p>
    </div>
  );
}
