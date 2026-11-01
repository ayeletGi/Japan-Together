import { describe, expect, it } from 'vitest';
import { parseAmount, parseErApi, parseFrankfurter } from '../src/features/yen/rate';

describe('yen converter', () => {
  it('reads both rate services and rejects nonsense', () => {
    expect(parseFrankfurter({ date: '2026-10-12', rates: { ILS: 0.01935 } })).toEqual({
      ilsPerJpy: 0.01935,
      date: '2026-10-12',
    });
    expect(parseFrankfurter({ date: '2026-10-12', rates: { ILS: 19.35 } })).toBeNull();
    expect(parseFrankfurter({})).toBeNull();
    expect(
      parseErApi({
        result: 'success',
        time_last_update_unix: 1791849451,
        rates: { ILS: 0.019403 },
      }),
    ).toEqual({ ilsPerJpy: 0.019403, date: '2026-10-12' });
    expect(parseErApi({ result: 'error' })).toBeNull();
  });

  it('understands amounts as people type them', () => {
    expect(parseAmount('1,000')).toBe(1000);
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount('12.50')).toBe(12.5);
    expect(parseAmount(' 3 000 ')).toBe(3000);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
  });
});
