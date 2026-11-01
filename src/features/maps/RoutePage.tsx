import { Bus, Clock, Footprints, MapPin, Plane, Star, TrainFront } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { BackLink } from '../../components/BackLink';
import { Card } from '../../components/Card';
import { ExternalLink } from '../../components/ExternalLink';
import { IconTile } from '../../components/IconTile';
import { Pill } from '../../components/Pill';
import { routeFor } from '../../data/routes';
import { neighbourDates } from '../../data/trip';
import type { RouteSegment } from '../../data/types';
import { useNow } from '../../hooks/useNow';
import { placeName, useLanguage } from '../../i18n';
import { formatDayMonth } from '../../lib/dates';
import { directionsUrl } from '../../lib/maps';
import { dayClock, reachedCount } from '../itinerary/progress';
import { RallyMap } from '../itinerary/RallyMap';
import { useDayPlan } from '../itinerary/useDayPlan';
import { directions } from './routes';
import './route.css';

function SegmentRow({ segment, index }: { segment: RouteSegment; index: number }) {
  const { t } = useTranslation();
  const ModeIcon = segment.shuttle ? Bus : segment.mode === 'walking' ? Footprints : TrainFront;
  return (
    <li className="route-step reveal-item">
      <IconTile tone={segment.mode === 'walking' ? 'mint' : 'sky'} size="md">
        <ModeIcon size={20} />
      </IconTile>
      <div className="route-step-body">
        <small className="muted">
          <span className="num">{index + 1}</span> · {t('common.fromPrefix')}
          <bdi>{segment.fromLabel}</bdi>
        </small>
        <span className="route-step-to">
          <bdi>{segment.toLabel}</bdi>
        </span>
        <span className="route-step-pills">
          <Pill tone="gray">{t(`routePage.modes.${segment.mode}`)}</Pill>
          {segment.shabbat && (
            <Pill tone="sun" icon={<Star size={12} aria-hidden="true" />}>
              {t('routePage.shabbat')}
            </Pill>
          )}
        </span>
        {segment.bookedTrain && <small className="muted">{t('routePage.bookedTrain')}</small>}
        {segment.shuttle && <small className="muted">{t('routePage.shuttle')}</small>}
      </div>
      <ExternalLink
        className="round-button route-step-maps"
        href={directions(segment)}
        aria-label={t('routePage.openSegment', { from: segment.fromLabel, to: segment.toLabel })}
      >
        <MapPin size={20} aria-hidden="true" />
      </ExternalLink>
    </li>
  );
}

/**
 * A day's route: the rally map (faint ahead, strong where walked, the cat), then every leg with
 * its own Google Maps link, and the neighbouring days. Slides in from Today.
 */
export function RoutePage({ date }: { date: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const { day, stops } = useDayPlan(date);
  const reached = reachedCount(stops, dayClock(date, useNow(), 0));
  const route = routeFor(date);
  const { previous, next } = neighbourDates(date);

  return (
    <div className="wrap route">
      <BackLink date={date} />
      <header className="route-head">
        <p className="route-kicker">
          {formatDayMonth(day.date, lang)} · {placeName(day.city, t)}
        </p>
        <h1>{t('routePage.title')}</h1>
        <p className="muted">{t('routePage.intro')}</p>
      </header>

      {stops.length > 0 && (
        <Card className="route-map-card">
          <RallyMap count={stops.length} reached={reached} rtl={lang === 'he'} title={day.title} />
        </Card>
      )}

      {route && route.segments.length > 0 ? (
        <ol className="route-steps">
          {route.segments.map((segment, index) => (
            <SegmentRow key={segment.id} segment={segment} index={index} />
          ))}
        </ol>
      ) : (
        <Card className="route-empty">
          <IconTile tone="lav">
            <Plane size={20} />
          </IconTile>
          <p>{t('routePage.flightDay')}</p>
          <ExternalLink
            className="btn btn--small"
            href={directionsUrl({ destination: 'Ben Gurion Airport Terminal 3', mode: 'transit' })}
          >
            {t('routePage.toAirport')}
          </ExternalLink>
        </Card>
      )}

      <a className="btn route-departures" href={paths.departures()}>
        <Clock size={16} aria-hidden="true" />
        {t('routePage.allDepartures')}
      </a>

      <nav className="route-days" aria-label={t('routePage.otherDays')}>
        {previous && (
          <a className="btn btn--small" href={paths.route(previous)}>
            {t('routePage.previousDay', { date: formatDayMonth(previous, lang) })}
          </a>
        )}
        {next && (
          <a className="btn btn--small" href={paths.route(next)}>
            {t('routePage.nextDay', { date: formatDayMonth(next, lang) })}
          </a>
        )}
      </nav>
      <p className="small-note">{t('routePage.footer')}</p>
    </div>
  );
}
