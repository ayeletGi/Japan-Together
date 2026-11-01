import { BedDouble, ExternalLink as ExternalIcon, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { useSheet } from '../../app/sheetContext';
import { ExternalLink } from '../../components/ExternalLink';
import { IconTile } from '../../components/IconTile';
import { IsraelTime } from '../../components/IsraelTime';
import { RichText } from '../../components/RichText';
import { Sheet, SheetHeader } from '../../components/Sheet';
import { cityTone } from '../../data/cities';
import { hotels, nights, type HotelId } from '../../data/hotels';
import { placeName, useContentProps } from '../../i18n';
import { formatDayDot } from '../../lib/dates';
import { searchUrl } from '../../lib/maps';
import { nightDates } from './hotelStays';
import { TaxiCard } from './TaxiCard';
import './hotel-sheet.css';

/** A hotel's hours, nights, extras, notes, taxi card and links. */
export function HotelSheet({ hotelId }: { hotelId: HotelId }) {
  const { t } = useTranslation();
  const content = useContentProps();
  const { close } = useSheet();
  const hotel = hotels[hotelId];
  const tone = cityTone[hotel.area];

  const openDay = (date: string) => {
    location.hash = paths.day(date);
    close();
  };

  return (
    <Sheet label={hotel.name} onClose={close}>
      <SheetHeader
        icon={
          <IconTile tone={tone} size="lg">
            <BedDouble size={24} strokeWidth={1.8} />
          </IconTile>
        }
        kicker={
          <>
            {placeName(hotel.city, t)} ·{' '}
            <bdi dir="ltr">
              {formatDayDot(hotel.checkIn)}–{formatDayDot(hotel.checkOut)}
            </bdi>{' '}
            · {t('hotels.nights', { count: nights(hotel) })}
          </>
        }
        title={<bdi>{hotel.name}</bdi>}
        onClose={close}
      />
      <div className="sheet-body">
        <div className="hotel-hours">
          <div>
            <small>{t('hotels.checkInFrom')}</small>
            <b className="num">{hotel.checkInFrom}</b>
            <IsraelTime date={hotel.checkIn} start={hotel.checkInFrom} variant="block" />
          </div>
          <div>
            <small>{t('hotels.checkOutBy')}</small>
            <b className="num">{hotel.checkOutBy}</b>
            <IsraelTime date={hotel.checkOut} start={hotel.checkOutBy} variant="block" />
          </div>
        </div>

        <section className="hotel-nights" aria-labelledby="hotel-nights-title">
          <h3 id="hotel-nights-title">{t('hotels.ourNights')}</h3>
          <div className="hotel-night-pills">
            {nightDates(hotel).map((date) => (
              <button
                key={date}
                type="button"
                className={`pill tone-${tone} num`}
                onClick={() => openDay(date)}
              >
                <bdi dir="ltr">{formatDayDot(date)}</bdi>
              </button>
            ))}
          </div>
        </section>

        {hotel.facilities && (
          <section className="hotel-list">
            <h3>{t('hotels.facilities')}</h3>
            <ul {...content}>
              {hotel.facilities.map((line) => (
                <li key={line}>
                  <RichText text={line} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {hotel.notes && (
          <section className="hotel-list">
            <h3>{t('hotels.notes')}</h3>
            <ul {...content}>
              {hotel.notes.map((line) => (
                <li key={line}>
                  <RichText text={line} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <TaxiCard hotelId={hotelId} />

        <div className="hotel-actions">
          <ExternalLink className="btn btn--primary" href={searchUrl(hotel.mapsQuery)}>
            <MapPin size={18} aria-hidden="true" />
            {t('hotels.navigate')}
          </ExternalLink>
          <ExternalLink className="btn" href={hotel.website}>
            <ExternalIcon size={16} aria-hidden="true" />
            {t('hotels.website')}
          </ExternalLink>
        </div>
      </div>
    </Sheet>
  );
}
