import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '../../components/ExternalLink';
import { weatherPlaces } from '../../data/weather';
import { useLanguage } from '../../i18n';
import { forecastSiteUrl } from '../../lib/forecastSite';
import { japanToday } from '../../lib/time';
import { useForecast, weatherKind } from './forecast';
import { walkingTip } from './walkingTip';
import './WeatherBadge.css';

const kindIcons = {
  clear: Sun,
  cloudy: CloudSun,
  fog: CloudFog,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
};

/**
 * The small weather badge in the hero: the real forecast's icon, high, and low–high. Its label and
 * tooltip carry the description and a walking tip. Too early for a forecast, it says when one comes.
 * Either way it links to that day's full forecast for the city on AccuWeather.
 */
export function WeatherBadge({ date }: { date: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const place = weatherPlaces[date];
  const { state } = useForecast(place, date);
  const siteUrl = place && forecastSiteUrl(place, date, japanToday(), lang);

  if (state.status === 'ready') {
    const { forecast } = state;
    const kind = weatherKind(forecast.code);
    const Icon = kindIcons[kind];
    const label = t('weatherBadge.label', {
      kind: t(`weather.kinds.${kind}`),
      min: forecast.min,
      max: forecast.max,
      tip: t(`weatherBadge.tips.${walkingTip(forecast)}`),
    });
    return (
      <ExternalLink className="weather-badge" href={siteUrl} aria-label={label} title={label}>
        <span className="weather-badge-icon">
          <Icon size={30} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span>
          <span className="weather-badge-high num">{forecast.max}°</span>
          <span className="weather-badge-range num" dir="ltr">
            {forecast.min}°–{forecast.max}°
          </span>
        </span>
      </ExternalLink>
    );
  }

  if (state.status === 'too-early') {
    const label = t('weather.tooEarly', { count: state.daysUntilWindow });
    return (
      <ExternalLink
        className="weather-badge weather-badge--waiting"
        href={siteUrl}
        aria-label={label}
        title={label}
      >
        <span className="weather-badge-icon">
          <Cloud size={26} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="weather-badge-range">{t('weatherBadge.soon')}</span>
      </ExternalLink>
    );
  }

  return null;
}
