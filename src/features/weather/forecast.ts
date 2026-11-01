import { useEffect, useState } from 'react';
import type { WeatherPlace } from '../../data/weather';
import { isAbortError } from '../../lib/net';
import { loadJson, saveJson } from '../../lib/storage';
import { daysBetween, JAPAN_TZ, japanToday } from '../../lib/time';

/**
 * Open-Meteo daily forecast. Short-range forecasts only reach ~16 days ahead, so dates further out
 * never show numbers; the UI explains that instead of inventing a forecast.
 */
const FORECAST_DAYS = 16;
const CACHE_MS = 3 * 60 * 60 * 1000;
const CACHE_PREFIX = 'forecast.';

export interface DailyForecast {
  date: string;
  max: number;
  min: number;
  rainChance: number | null;
  code: number;
  fetchedAt: string;
}

export type ForecastState =
  | { status: 'too-early'; daysUntilWindow: number }
  | { status: 'past' }
  | { status: 'loading' }
  | { status: 'ready'; forecast: DailyForecast }
  | { status: 'unavailable' };

/** Whether a forecast can exist for `date` today, without fetching. */
export function forecastWindow(date: string, today: string) {
  const ahead = daysBetween(today, date);
  if (ahead < 0) return { status: 'past' as const };
  if (ahead >= FORECAST_DAYS)
    return { status: 'too-early' as const, daysUntilWindow: ahead - FORECAST_DAYS + 1 };
  return { status: 'open' as const };
}

function forecastUrl(place: WeatherPlace, date: string): string {
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: JAPAN_TZ,
    start_date: date,
    end_date: date,
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

interface OpenMeteoDaily {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: (number | null)[];
  };
}

export function parseForecast(json: OpenMeteoDaily, fetchedAt: string): DailyForecast | null {
  const daily = json.daily;
  if (!daily?.time?.length || daily.temperature_2m_max[0] == null) return null;
  return {
    date: daily.time[0],
    max: Math.round(daily.temperature_2m_max[0]),
    min: Math.round(daily.temperature_2m_min[0]),
    rainChance: daily.precipitation_probability_max?.[0] ?? null,
    code: daily.weather_code[0],
    fetchedAt,
  };
}

function readCache(key: string): DailyForecast | null {
  const cached = loadJson<DailyForecast>(key);
  return cached && Date.now() - Date.parse(cached.fetchedAt) < CACHE_MS ? cached : null;
}

/** Loads the forecast for one day and place; `refresh()` skips the cache for that day only. */
export function useForecast(place: WeatherPlace | undefined, date: string) {
  const range = forecastWindow(date, japanToday());
  const [state, setState] = useState<ForecastState>({ status: 'loading' });
  const key = place ? `${CACHE_PREFIX}${place.name}.${date}` : '';
  const open = place && range.status === 'open';
  // Refreshes count per day, so opening another day afterwards still uses its cache.
  const [reload, setReload] = useState({ key: '', count: 0 });
  const reloads = reload.key === key ? reload.count : 0;

  useEffect(() => {
    if (!open || !place) return;
    const cached = reloads === 0 ? readCache(key) : null;
    if (cached) {
      setState({ status: 'ready', forecast: cached });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetch(forecastUrl(place, date), { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((json: OpenMeteoDaily) => {
        const forecast = parseForecast(json, new Date().toISOString());
        if (!forecast) throw new Error('empty');
        saveJson(key, forecast); // Without storage: one more request later.
        setState({ status: 'ready', forecast });
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) setState({ status: 'unavailable' });
      });
    return () => controller.abort();
  }, [open, place, date, key, reloads]);

  const refresh = () =>
    setReload((current) => ({ key, count: current.key === key ? current.count + 1 : 1 }));

  if (!place) return { state: { status: 'unavailable' } as ForecastState, refresh };
  if (range.status === 'too-early') return { state: range as ForecastState, refresh };
  if (range.status === 'past') return { state: { status: 'past' } as ForecastState, refresh };
  return { state, refresh };
}

/** WMO weather code → a small description key. */
export function weatherKind(code: number): 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm' {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'fog';
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  return 'rain';
}
