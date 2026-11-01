import { Backpack, CalendarCheck, CircleSlash, Clock, WashingMachine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { hotels } from '../../data/hotels';
import { hotelLaundry, laundryEvents, laundryKit, type HotelLaundry } from '../../data/laundry';
import { useContentProps } from '../../i18n';
import { directionsUrl } from '../../lib/maps';
import { PlaceCard, PlaceFact } from './PlaceCard';

const shortDate = (iso: string) => `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}`;

const planIcons = { planned: CalendarCheck, backup: Clock, optional: Clock, none: CircleSlash };
const planTones = { planned: 'mint', backup: 'sun', optional: 'gray', none: 'gray' } as const;

function LaundryCard({ stay, date }: { stay: HotelLaundry; date?: string }) {
  const { t } = useTranslation();
  const content = useContentProps();
  const hotel = hotels[stay.hotelId];
  const event = laundryEvents.find((item) => item.id === stay.eventId);
  const PlanIcon = planIcons[stay.plan];
  const onRoute = !!date && event?.date === date;
  return (
    <PlaceCard
      icon={<WashingMachine size={24} />}
      tone="sky"
      name={hotel.name}
      text={stay.where}
      highlight={onRoute}
      mapsHref={
        stay.fallbackQuery
          ? directionsUrl({
              origin: hotel.mapsQuery,
              destination: stay.fallbackQuery,
              mode: 'walking',
            })
          : undefined
      }
      mapsLabel={t('laundry.findNearby')}
      facts={
        <>
          <PlaceFact>
            {t('laundry.pay')} {stay.pay}
          </PlaceFact>
          {event?.date && (
            <PlaceFact icon={<Clock size={13} aria-hidden="true" />}>
              <a className="inline-link" href={paths.day(event.date)} dir="ltr">
                {shortDate(event.date)} · {event.time}–{event.end}
              </a>
            </PlaceFact>
          )}
        </>
      }
      pills={
        <>
          <Pill tone="gray">
            <span dir="ltr">
              {shortDate(hotel.checkIn)}–{shortDate(hotel.checkOut)}
            </span>
          </Pill>
          <Pill tone={planTones[stay.plan]} icon={<PlanIcon size={12} aria-hidden="true" />}>
            {t(`laundry.plan.${stay.plan}`)}
          </Pill>
          {onRoute && <Pill tone="pink">{t('discover.onRoute')}</Pill>}
        </>
      }
    >
      <p className="small-note" {...content}>
        {stay.tip}
      </p>
    </PlaceCard>
  );
}

export function LaundryTab({ date }: { date?: string }) {
  const { t } = useTranslation();
  const content = useContentProps();
  // For a chosen day: the hotel(s) we are at that day — both on a hotel-change day.
  const selected = date
    ? hotelLaundry.filter((stay) => {
        const hotel = hotels[stay.hotelId];
        return date >= hotel.checkIn && date <= hotel.checkOut;
      })
    : [];
  const list = selected.length ? selected : hotelLaundry;
  return (
    <div className="discover-panel">
      <p className="discover-note">{t('laundry.intro')}</p>
      {date && selected.length === 0 && <p className="discover-note">{t('laundry.noneThatDay')}</p>}
      <div className="places">
        {list.map((stay) => (
          <LaundryCard key={stay.hotelId} stay={stay} date={date} />
        ))}
      </div>
      {selected.length > 0 && (
        <a className="btn discover-more" href={paths.discover('laundry')}>
          {t('laundry.allHotels', { count: hotelLaundry.length })}
        </a>
      )}
      <Card as="article" className="laundry-kit">
        <h3>
          <Backpack size={17} aria-hidden="true" /> {t('laundry.kit')}
        </h3>
        <ul {...content}>
          {laundryKit.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
      <p className="small-note">{t('laundry.footer')}</p>
    </div>
  );
}
