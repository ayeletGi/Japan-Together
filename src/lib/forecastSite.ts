import type { WeatherPlace } from '../data/weather';
import type { Language } from '../i18n';
import { daysBetween } from './time';

/**
 * AccuWeather's forecast page for one day in a city, in the app's language. Its `day` counts from
 * 1 = today in Japan; past the window it shows the furthest day it has, so a far date still lands.
 */
export function forecastSiteUrl(
  { accuWeather: { slug, key } }: WeatherPlace,
  date: string,
  today: string,
  lang: Language,
): string {
  const day = Math.max(1, daysBetween(today, date) + 1);
  return `https://www.accuweather.com/${lang}/jp/${slug}/${key}/daily-weather-forecast/${key}?day=${day}`;
}
