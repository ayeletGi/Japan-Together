import { useTranslation } from 'react-i18next';
import { BackLink } from '../../components/BackLink';
import { Card } from '../../components/Card';
import { ExternalLink } from '../../components/ExternalLink';
import { IsraelTime } from '../../components/IsraelTime';
import { useContentProps, useLanguage } from '../../i18n';
import { formatDotted, formatWeekdayDayMonth } from '../../lib/dates';
import { LeaveBlock } from '../itinerary/LeaveBlock';
import { leaveFor } from './leaves';
import { checkedOn, departurePlans, type DeparturePlan } from '../../data/departures';
import { departureMapsUrl } from './plans';
import './departures.css';

function ParkSlots({ plan }: { plan: DeparturePlan }) {
  const { t } = useTranslation();
  const content = useContentProps();
  return (
    <details className="park-slots">
      <summary>{t('departuresPage.parkSlots')}</summary>
      <p className="muted" {...content}>
        {plan.internalAdvice}
      </p>
      <ul>
        {plan.internalEvents?.map((event) => (
          <li key={event.id}>
            <bdi>{event.label}</bdi>
            <span className="muted">
              {event.time ? (
                <>
                  <bdi className="num">
                    {event.time}–{event.end}
                  </bdi>{' '}
                  <IsraelTime date={plan.date} start={event.time} end={event.end} />
                </>
              ) : (
                t('departuresPage.noFixedTime')
              )}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Where the advice came from, and a walking route for days we're probably nearby already. */
function Sources({ plan }: { plan: DeparturePlan }) {
  const { t } = useTranslation();
  const links = [
    plan.likelyNearby && {
      label: plan.likelyNearby.routeLabel,
      url: departureMapsUrl(plan, false),
    },
    plan.source,
    plan.parkCalendar,
  ].filter((link): link is { label: string; url: string } => !!link);
  return (
    <div className="departure-sources">
      {links.map((link) => (
        <ExternalLink key={link.url} className="text-link" href={link.url}>
          <bdi>{link.label}</bdi>
        </ExternalLink>
      ))}
      <small className="muted">
        {t('departure.checkedNote', { date: formatDotted(checkedOn), arriveBy: plan.arriveBy })}
      </small>
    </div>
  );
}

/** Every confirmed attraction's departure, each with the same leave block as the stop sheet. */
export function DeparturesPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const content = useContentProps();
  return (
    <div className="wrap departures">
      <BackLink />
      <header className="departures-head">
        <h1>{t('departuresPage.title')}</h1>
        <p className="muted">{t('departuresPage.intro')}</p>
      </header>

      {departurePlans.map((plan) => {
        const leave = leaveFor(plan.eventId);
        return (
          <Card as="article" className="departure-visit" key={plan.eventId}>
            <header>
              <p className="departure-date">{formatWeekdayDayMonth(plan.date, lang)}</p>
              <h2>
                <bdi>{plan.title}</bdi>
              </h2>
            </header>
            {leave && <LeaveBlock date={plan.date} leave={leave} />}
            {plan.note && (
              <p className="departure-note" {...content}>
                {plan.note}
              </p>
            )}
            <Sources plan={plan} />
            {plan.internalEvents && <ParkSlots plan={plan} />}
          </Card>
        );
      })}

      <p className="small-note">{t('departuresPage.footer')}</p>
    </div>
  );
}
