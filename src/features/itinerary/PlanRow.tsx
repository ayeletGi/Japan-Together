import { Footprints, Pencil, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IsraelTime } from '../../components/IsraelTime';
import { Pill } from '../../components/Pill';
import { RichText } from '../../components/RichText';
import { eventTimeZone } from '../../data/trip';
import { useContentProps } from '../../i18n';
import { stopPrice, yenToShekels } from '../../lib/dailyBudget';
import { formatShekelsRounded } from '../../lib/money';
import type { StopState } from './progress';
import { stopIcon } from './stopLook';
import type { PlanStop } from './stops';

/** The time of a stop with its Israel time, or "no fixed time". */
export function StopTime({ stop }: { stop: PlanStop }) {
  const { t } = useTranslation();
  if (!stop.time) return <span>{t('plan.noTime')}</span>;
  const zone = stop.event ? eventTimeZone(stop.event) : undefined;
  return (
    <>
      <time className="num" dir="ltr">
        {stop.time}
      </time>
      <IsraelTime date={stop.date} start={stop.time} zone={zone} />
    </>
  );
}

/** "about ₪43 each · 💳 card": the stop's share of the daily budget, when it has one. */
function StopPriceLine({ stopId, ilsPerJpy }: { stopId: string; ilsPerJpy: number }) {
  const { t } = useTranslation();
  const price = stopPrice(stopId, undefined, ilsPerJpy);
  if (!price) return null;
  return (
    <span className="plan-price muted">
      {t('daily.stopPrice', {
        amount: formatShekelsRounded(yenToShekels(price.yen, ilsPerJpy) * 100),
      })}
      {' · '}
      {t(price.cash ? 'daily.stopCash' : 'daily.stopCard')}
    </span>
  );
}

/**
 * One stop on the day's timeline, with its rally stamp on the path; tapping opens its sheet, ✏️
 * opens it for editing in place.
 */
export function PlanRow({
  stop,
  state,
  onOpen,
  onEdit,
  ilsPerJpy,
  stamped,
  onStamp,
}: {
  stop: PlanStop;
  state: StopState | null;
  onOpen: () => void;
  onEdit?: () => void;
  /** Today's yen → shekel rate, for the stop's price. */
  ilsPerJpy: number;
  /** The cat has reached this stop: its stamp is inked. */
  stamped: boolean;
  /** Before the trip: tapping the stamp walks the cat to this stop. */
  onStamp?: () => void;
}) {
  const { t } = useTranslation();
  const content = useContentProps();
  const Icon = stopIcon(stop);
  const stampClass = `plan-stamp${stamped ? ' is-done' : ''}`;
  const stampIcon = <Icon size={22} strokeWidth={1.8} aria-hidden="true" />;
  return (
    <li className={`plan-row${state ? ` is-${state}` : ''}${onEdit ? ' is-editable' : ''}`}>
      {onStamp ? (
        <button
          type="button"
          className={stampClass}
          aria-label={t(stamped ? 'rally.stamped' : 'rally.collect', { title: stop.title })}
          onClick={onStamp}
        >
          {stampIcon}
        </button>
      ) : (
        <span
          className={stampClass}
          {...(stamped
            ? { role: 'img', 'aria-label': t('rally.stamped', { title: stop.title }) }
            : { 'aria-hidden': true })}
        >
          {stampIcon}
        </span>
      )}
      <button type="button" className="plan-box" onClick={onOpen}>
        <span className="spread">
          <bdi className="plan-title" {...content}>
            {stop.title}
          </bdi>
          <span className="row plan-marks">
            {state === 'now' && <Pill tone="pink">{t('plan.now')}</Pill>}
            {stop.pinned && (
              <span
                className="plan-pin"
                title={t('plan.pinnedTitle')}
                role="img"
                aria-label={t('plan.pinnedTitle')}
              >
                📌
              </span>
            )}
          </span>
        </span>
        <span className="plan-meta muted">
          <StopTime stop={stop} />
          {stop.note && (
            <>
              {' · '}
              <span {...content}>
                <RichText text={stop.note} />
              </span>
            </>
          )}
        </span>
        {(stop.leave || stop.ticket) && (
          <span className="plan-tags">
            {stop.leave && (
              <Pill tone="sun" icon={<Footprints size={13} aria-hidden="true" />}>
                {t('plan.leaveAt')}
                <span className="num">{stop.leave.leave}</span>
                <IsraelTime date={stop.date} start={stop.leave.leave} />
                {stop.leave.estimate && (
                  <span className="plan-estimate">{t('leave.estimate')}</span>
                )}
              </Pill>
            )}
            {stop.ticket && (
              <Pill tone="lav" icon={<Ticket size={13} aria-hidden="true" />}>
                {t('plan.ticket')}
              </Pill>
            )}
          </span>
        )}
        <StopPriceLine stopId={stop.id} ilsPerJpy={ilsPerJpy} />
      </button>
      {onEdit && (
        <button
          type="button"
          className="plan-edit"
          onClick={onEdit}
          aria-label={t('live.editStop', { title: stop.title })}
        >
          <Pencil size={15} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}
