import { BedDouble, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { cityTone } from '../../data/cities';
import { hotelList } from '../../data/hotels';
import { placeName } from '../../i18n';
import { dayOfMonth } from '../../lib/dates';

/** "Where we sleep · 5 hotels": a dot in the city colour, the name and dates; opens the hotel. */
export function HotelList() {
  const { t } = useTranslation();
  const { open } = useSheet();
  return (
    <section className="stays" id="hotels" aria-labelledby="stays-title">
      <h2 id="stays-title" className="stays-title">
        <BedDouble size={16} aria-hidden="true" />
        {t('schedule.hotels', { count: hotelList.length })}
      </h2>
      <div className="stays-grid">
        {hotelList.map((hotel) => (
          <button
            key={hotel.id}
            type="button"
            className="stay"
            onClick={() => open({ kind: 'hotel', hotelId: hotel.id })}
          >
            <i className={`stay-dot tone-${cityTone[hotel.area]}`} aria-hidden="true" />
            <span className="stay-text">
              <bdi>{hotel.shortName}</bdi>
              <small>
                {placeName(hotel.city, t)} ·{' '}
                <bdi dir="ltr">
                  {dayOfMonth(hotel.checkIn)}–{dayOfMonth(hotel.checkOut)}
                </bdi>{' '}
                {t('schedule.inNovember')}
              </small>
            </span>
            <ChevronLeft size={14} className="flip-ltr stay-chevron" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
