import { useCallback, useEffect, useState } from 'react';
import { JPY_RATE } from '../../data/budget';
import { isAbortError } from '../../lib/net';
import { loadJson, saveJson } from '../../lib/storage';

/** A yen → shekel rate and where it came from, so the screen can say how fresh it is. */
export interface YenRate {
  ilsPerJpy: number;
  /** The day the rate is for (YYYY-MM-DD). */
  date: string;
  source: 'live' | 'saved' | 'builtin';
}

export type RateStatus = 'loading' | 'idle' | 'offline';

const CACHE_KEY = 'yenRate';
/** A saved rate younger than this is used without asking again. */
const FRESH_MS = 6 * 60 * 60 * 1000;

const builtin: YenRate = {
  ilsPerJpy: JPY_RATE.ilsPerJpy,
  date: JPY_RATE.checkedOn,
  source: 'builtin',
};

/** Rejects anything that can't be a yen → shekel rate, so a bad response never reaches the screen. */
const plausible = (rate: unknown): rate is number =>
  typeof rate === 'number' && rate > 0.005 && rate < 0.1;

/** Frankfurter (European Central Bank reference rates). */
export function parseFrankfurter(json: unknown): Omit<YenRate, 'source'> | null {
  const data = json as { date?: string; rates?: { ILS?: number } };
  const rate = data?.rates?.ILS;
  return plausible(rate) && typeof data.date === 'string'
    ? { ilsPerJpy: rate, date: data.date }
    : null;
}

/** ExchangeRate-API's open endpoint, used when Frankfurter doesn't answer. */
export function parseErApi(json: unknown): Omit<YenRate, 'source'> | null {
  const data = json as {
    result?: string;
    time_last_update_unix?: number;
    rates?: { ILS?: number };
  };
  const rate = data?.rates?.ILS;
  if (data?.result !== 'success' || !plausible(rate) || !data.time_last_update_unix) return null;
  return {
    ilsPerJpy: rate,
    date: new Date(data.time_last_update_unix * 1000).toISOString().slice(0, 10),
  };
}

const sources = [
  { url: 'https://api.frankfurter.dev/v1/latest?base=JPY&symbols=ILS', parse: parseFrankfurter },
  { url: 'https://open.er-api.com/v6/latest/JPY', parse: parseErApi },
];

async function fetchLiveRate(signal: AbortSignal): Promise<YenRate> {
  for (const { url, parse } of sources) {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) continue;
      const rate = parse(await response.json());
      if (rate) return { ...rate, source: 'live' };
    } catch (error) {
      if (isAbortError(error)) throw error;
    }
  }
  throw new Error('no rate');
}

function readSaved(): (YenRate & { fetchedAt: number }) | null {
  const saved = loadJson<YenRate & { fetchedAt: number }>(CACHE_KEY);
  return saved && plausible(saved.ilsPerJpy) ? { ...saved, source: 'saved' } : null;
}

/** Without storage the next visit just asks again. */
const save = (rate: YenRate) => saveJson(CACHE_KEY, { ...rate, fetchedAt: Date.now() });

/**
 * The current rate: live when online, otherwise the last one this phone fetched, otherwise the
 * rate built into the app. Never blocks the converter; it works from the first render.
 */
export function useYenRate() {
  const [rate, setRate] = useState<YenRate>(() => readSaved() ?? builtin);
  const [status, setStatus] = useState<RateStatus>('loading');
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    const saved = readSaved();
    if (reloads === 0 && saved && Date.now() - saved.fetchedAt < FRESH_MS) {
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    fetchLiveRate(controller.signal)
      .then((live) => {
        save(live);
        setRate(live);
        setStatus('idle');
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) setStatus('offline');
      });
    return () => controller.abort();
  }, [reloads]);

  const refresh = useCallback(() => setReloads((count) => count + 1), []);
  return { rate, status, refresh };
}

/** Typed text → number; accepts thousands separators and a comma as the decimal mark. */
export function parseAmount(text: string): number | null {
  let clean = text.replace(/[\s'’]/g, '');
  // "12,5" is a decimal comma; "1,000" is a thousands separator.
  clean =
    /,\d{1,2}$/.test(clean) && !clean.includes('.')
      ? clean.replace(',', '.')
      : clean.replace(/,/g, '');
  if (clean === '') return null;
  const value = Number(clean);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
