import { useTranslation } from 'react-i18next';
import { ExternalLink } from '../../components/ExternalLink';
import { IsraelTime } from '../../components/IsraelTime';
import { RichText } from '../../components/RichText';
import { useContentProps } from '../../i18n';
import type { LeaveInfo } from '../../data/departures';

/** The sun-coloured "when to leave" block of the stop sheet. */
export function LeaveBlock({ date, leave }: { date: string; leave: LeaveInfo }) {
  const { t } = useTranslation();
  const content = useContentProps();
  const fromKey =
    leave.from === 'park' || leave.from === 'stop'
      ? 'leave.go'
      : leave.from === 'shuttle'
        ? 'leave.shuttle'
        : 'leave.fromHotel';
  return (
    <section className="leave-block" aria-label={t('leave.label')}>
      <div className="spread leave-clocks">
        <div>
          <div className="leave-label">
            {t(fromKey)}
            {leave.estimate && ` ${t('leave.estimate')}`}
          </div>
          <div className="leave-big num" dir="ltr">
            {leave.leave}
          </div>
          <IsraelTime date={date} start={leave.leave} variant="block" />
        </div>
        <div className="leave-arrive">
          <div className="leave-label">{t('leave.arriveBy')}</div>
          <div className="leave-mid num" dir="ltr">
            {leave.arriveBy}
          </div>
          <IsraelTime date={date} start={leave.arriveBy} variant="block" />
        </div>
      </div>
      <ol className="leave-steps" {...content}>
        {leave.steps.map((step) => (
          <li key={step}>
            <RichText text={step} />
          </li>
        ))}
      </ol>
      {leave.booking && (
        <p className="leave-note" {...content}>
          <RichText text={leave.booking} />
        </p>
      )}
      {leave.why && (
        <details className="leave-why">
          <summary>{t('leave.why')}</summary>
          <p {...content}>
            <RichText text={leave.why} />
          </p>
        </details>
      )}
      {leave.mapsUrl && (
        <ExternalLink className="text-link leave-maps" href={leave.mapsUrl}>
          {t('leave.maps')}
        </ExternalLink>
      )}
    </section>
  );
}
