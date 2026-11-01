import {
  BedDouble,
  CalendarClock,
  FerrisWheel,
  Flower2,
  Moon,
  Plane,
  Sparkles,
  TrainFront,
  Utensils,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { ActionRow } from '../../components/ActionRow';
import { DriveLogo } from '../../components/DriveLogo';
import { ExternalLink } from '../../components/ExternalLink';
import { RichText } from '../../components/RichText';
import { SectionTitle } from '../../components/SectionTitle';
import type { Tone } from '../../components/tone';
import { cityTone } from '../../data/cities';
import { hotelList, nights, type TripHotel } from '../../data/hotels';
import { DRIVE_FOLDER_URL } from '../../data/privateFolder';
import { reservationNeeds } from '../../data/reservations';
import { tickets, type TicketCategory, type TicketEntry } from '../../data/tickets';
import { getDay } from '../../data/trip';
import { placeName, useContentProps, useLanguage } from '../../i18n';
import { formatDayDot, formatWeekdayDayMonth } from '../../lib/dates';
import './tickets.css';

const categoryLook: Record<TicketCategory, { icon: ReactNode; tone: Tone }> = {
  flights: { icon: <Plane size={17} />, tone: 'lav' },
  trains: { icon: <TrainFront size={17} />, tone: 'mint' },
  parks: { icon: <FerrisWheel size={17} />, tone: 'sky' },
  teamlab: { icon: <Sparkles size={17} />, tone: 'lav' },
  hotels: { icon: <BedDouble size={17} />, tone: 'pink' },
  restaurants: { icon: <Utensils size={17} />, tone: 'pink' },
  chabad: { icon: <Moon size={17} />, tone: 'sun' },
  treatments: { icon: <Flower2 size={17} />, tone: 'pink' },
};

/** One row: a booked ticket (opens its stop) or a hotel stay (opens the hotel sheet). */
type Booking =
  | { kind: 'ticket'; date: string; ticket: TicketEntry }
  | { kind: 'hotel'; date: string; hotel: TripHotel };

// The tickets data has one "five hotels" entry; here each stay gets its own row on its check-in day.
const bookings: Booking[] = [
  ...tickets
    .filter((ticket) => ticket.category !== 'hotels')
    .map((ticket): Booking => ({ kind: 'ticket', date: ticket.date, ticket })),
  ...hotelList.map((hotel): Booking => ({ kind: 'hotel', date: hotel.checkIn, hotel })),
].sort((a, b) => a.date.localeCompare(b.date));

const dates = [...new Set(bookings.map((booking) => booking.date))];

/**
 * The tickets tab: everything we booked, by date. A ticket opens its stop in the plan and a hotel
 * opens the hotel sheet; the real tickets stay in the shared Drive folder. Then what still needs
 * booking.
 */
export function TicketsPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const content = useContentProps();
  const { open } = useSheet();
  return (
    <div className="wrap tickets">
      <header className="tickets-head">
        <div>
          <p className="tickets-kicker">{t('tickets.kicker')}</p>
          <h1>{t('tickets.title')}</h1>
        </div>
        <ExternalLink className="btn btn--small" href={DRIVE_FOLDER_URL}>
          <DriveLogo size={16} />
          {t('useful.allConfirmations')}
        </ExternalLink>
      </header>

      <div className="tickets-days">
        {dates.map((date) => (
          <section key={date} className="tickets-day" aria-labelledby={`tickets-${date}`}>
            <h2 className="tickets-date" id={`tickets-${date}`}>
              {formatWeekdayDayMonth(date, lang)} · {placeName(getDay(date)?.city ?? '', t)}
            </h2>
            <div className="action-list">
              {bookings
                .filter((booking) => booking.date === date)
                .map((booking) =>
                  booking.kind === 'ticket' ? (
                    <ActionRow
                      key={booking.ticket.id}
                      icon={categoryLook[booking.ticket.category].icon}
                      tone={categoryLook[booking.ticket.category].tone}
                      title={<span {...content}>{booking.ticket.title}</span>}
                      sub={
                        <span className="ticket-sub" {...content}>
                          <span>
                            <RichText text={booking.ticket.when} />
                          </span>
                          <span className="ticket-bring">
                            {t('tickets.bring')} {booking.ticket.bring}
                          </span>
                        </span>
                      }
                      onClick={() =>
                        open({
                          kind: 'stop',
                          date: booking.ticket.date,
                          stopId: booking.ticket.eventIds[0],
                          noLeave: true,
                        })
                      }
                    />
                  ) : (
                    <ActionRow
                      key={booking.hotel.id}
                      icon={categoryLook.hotels.icon}
                      tone={cityTone[booking.hotel.area]}
                      title={<bdi>{booking.hotel.name}</bdi>}
                      sub={
                        <>
                          {t('hotels.checkInFrom')}
                          <span className="num">{booking.hotel.checkInFrom}</span> ·{' '}
                          {t('hotels.nights', { count: nights(booking.hotel) })} ·{' '}
                          <bdi dir="ltr" className="num">
                            {formatDayDot(booking.hotel.checkIn)}–
                            {formatDayDot(booking.hotel.checkOut)}
                          </bdi>
                        </>
                      }
                      onClick={() => open({ kind: 'hotel', hotelId: booking.hotel.id })}
                    />
                  ),
                )}
            </div>
          </section>
        ))}
      </div>

      {reservationNeeds.length > 0 && (
        <section aria-labelledby="not-booked-title">
          <SectionTitle id="not-booked-title">{t('useful.notBooked')}</SectionTitle>
          <div className="action-list">
            {reservationNeeds.map((need) => (
              <ActionRow
                key={need.eventId}
                external
                href={need.book.url}
                tone={need.level === 'required' ? 'pink' : 'sun'}
                icon={<CalendarClock size={16} />}
                title={<bdi>{need.title}</bdi>}
                sub={
                  <>
                    <span className="num">{formatDayDot(need.date)}</span> ·{' '}
                    {t(`reservation.flag.${need.level}`)}
                  </>
                }
              />
            ))}
          </div>
        </section>
      )}

      <p className="small-note">{t('tickets.privacy')}</p>
    </div>
  );
}
