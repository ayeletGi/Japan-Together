import { BedDouble, Check, CircleAlert, FolderOpen, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { ActionRow } from '../../components/ActionRow';
import { ExternalLink } from '../../components/ExternalLink';
import { IconTile } from '../../components/IconTile';
import { IsraelTime } from '../../components/IsraelTime';
import { Pill } from '../../components/Pill';
import { RichText } from '../../components/RichText';
import { Sheet, SheetHeader } from '../../components/Sheet';
import { SourceCheckNote } from '../../components/SourceCheckNote';
import { restaurantForEvent } from '../../data/dining';
import { journeyFor } from '../../data/journeys';
import { DRIVE_FOLDER_URL } from '../../data/privateFolder';
import { reservationFor } from '../../data/reservations';
import type { TripEvent } from '../../data/types';
import { useContentProps, useLanguage } from '../../i18n';
import { formatDayMonth } from '../../lib/dates';
import { JAPAN_TZ } from '../../lib/time';
import { hotelOfEvent } from '../hotels/hotelStays';
import { HelpAround } from './HelpAround';
import { LeaveBlock } from './LeaveBlock';
import { StopTime } from './PlanRow';
import { isConfirmed, statusKey } from './eventDisplay';
import { stopIcon, stopTone } from './stopLook';
import type { PlanStop } from './stops';
import { useDayPlan } from './useDayPlan';
import './stop-sheet.css';

function JourneyLine({ event }: { event: TripEvent }) {
  const { t } = useTranslation();
  const journey = journeyFor(event.id);
  if (!journey) return null;
  const leg = (label: string, part: typeof journey.depart) => (
    <div>
      <div className="leave-label">{label}</div>
      <div className="num journey-clock" dir="ltr">
        {part.clock}
      </div>
      <small>
        <bdi>{part.place}</bdi> ·{' '}
        {t(part.zone === JAPAN_TZ ? 'time.japanClock' : 'time.israelClock')}
      </small>
      <IsraelTime date={part.date} start={part.clock} zone={part.zone} variant="block" />
    </div>
  );
  return (
    <section className="journey-line" aria-label={journey.number}>
      <div className="spread">
        {leg(t('stop.departs'), journey.depart)}
        {leg(t('stop.arrives'), journey.arrive)}
      </div>
      {journey.seats && <p className="small-note">{journey.seats}</p>}
    </section>
  );
}

function StopBody({
  stops,
  index,
  noLeave = false,
}: {
  stops: PlanStop[];
  index: number;
  noLeave?: boolean;
}) {
  const { t } = useTranslation();
  const content = useContentProps();
  const { open } = useSheet();
  const stop = stops[index];
  const event = stop.event;
  const restaurant = event ? restaurantForEvent(event.id) : undefined;
  const reservation = event && !isConfirmed(event) ? reservationFor(event.id) : undefined;
  const hotel = hotelOfEvent(event);

  return (
    <div className="sheet-body">
      {stop.leave && !noLeave && <LeaveBlock date={stop.date} leave={stop.leave} />}
      {event && <JourneyLine event={event} />}
      {stop.ticket && (
        <section className="ticket-block">
          <IconTile tone="lav" size="lg">
            <Ticket size={24} />
          </IconTile>
          <div className="ticket-text">
            <small>{t('stop.ticket')}</small>
            <bdi className="ticket-title">{stop.ticket.title}</bdi>
            <small {...content}>
              <RichText text={stop.ticket.quantity} />
            </small>
            <small {...content}>
              <RichText text={stop.ticket.bring} />
            </small>
            <ExternalLink className="text-link" href={DRIVE_FOLDER_URL}>
              <FolderOpen size={14} aria-hidden="true" />
              {t('stop.openFolder')}
            </ExternalLink>
            {stop.ticket.howToOpen && (
              <ExternalLink className="text-link" href={stop.ticket.howToOpen.url}>
                <bdi>{stop.ticket.howToOpen.label}</bdi>
              </ExternalLink>
            )}
          </div>
        </section>
      )}
      {stop.leave?.tip && (
        <p className="stop-tip" {...content}>
          <RichText text={stop.leave.tip} />
        </p>
      )}
      {reservation && (
        <section className={`to-book to-book--${reservation.level}`}>
          <strong>
            <CircleAlert size={16} aria-hidden="true" />
            {t(`reservation.${reservation.level}`)}
          </strong>
          <p {...content}>
            <RichText text={reservation.why} />
          </p>
          <ExternalLink className="text-link" href={reservation.book.url}>
            <bdi>{reservation.book.label}</bdi>
          </ExternalLink>
        </section>
      )}
      {event && (
        <div className="stop-status">
          <Pill
            tone={isConfirmed(event) ? 'mint' : event.status === 'planned' ? 'lav' : 'sun'}
            icon={isConfirmed(event) ? <Check size={13} aria-hidden="true" /> : undefined}
          >
            {t(`event.statusLabels.${statusKey(event)}`)}
          </Pill>
          {restaurant && (
            <span className="small-note">
              {t('stop.hours')} <bdi>{restaurant.plannerHours?.hours ?? restaurant.hours}</bdi>
            </span>
          )}
          {restaurant?.check && <SourceCheckNote check={restaurant.check} />}
        </div>
      )}
      {hotel && (
        <ActionRow
          icon={<BedDouble size={18} />}
          title={t('stop.aboutHotel')}
          sub={t('stop.aboutHotelSub')}
          onClick={() => open({ kind: 'hotel', hotelId: hotel.id })}
        />
      )}
      <HelpAround stops={stops} index={index} />
      {event && (
        <details className="stop-details">
          <summary>{t('stop.details')}</summary>
          <strong {...content}>{event.title}</strong>
          <p {...content}>
            <RichText text={event.note} />
          </p>
          {event.hotelSchedule && (
            <p>
              {t('event.hotelHours', {
                checkin: event.hotelSchedule.checkin,
                checkout: event.hotelSchedule.checkout,
              })}
            </p>
          )}
          <p className="small-note">
            <bdi>{event.place}</bdi>
          </p>
        </details>
      )}
    </div>
  );
}

/** Everything about one stop: when to leave, the ticket, its status, and help around it. */
export function StopSheet({
  date,
  stopId,
  noLeave = false,
}: {
  date: string;
  stopId: string;
  noLeave?: boolean;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const content = useContentProps();
  const { close } = useSheet();
  const { stops } = useDayPlan(date);
  const index = stops.findIndex((stop) => stop.id === stopId);
  if (index < 0) return null;
  const stop = stops[index];
  const Icon = stopIcon(stop);
  return (
    <Sheet label={stop.title} onClose={close}>
      <SheetHeader
        icon={
          <IconTile tone={stopTone(stop)} size="lg">
            <Icon size={24} strokeWidth={1.8} />
          </IconTile>
        }
        kicker={
          <>
            <bdi>{formatDayMonth(date, lang)}</bdi> · <StopTime stop={stop} />
          </>
        }
        title={<bdi {...content}>{stop.title}</bdi>}
        sub={
          stop.note && (
            <span {...content}>
              <RichText text={stop.note} />
            </span>
          )
        }
        onClose={close}
      />
      <StopBody stops={stops} index={index} noLeave={noLeave} />
      {stop.edit && <p className="small-note">{t('edit.savedHere')}</p>}
    </Sheet>
  );
}
