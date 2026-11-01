import type { DailyForecast } from './forecast';

export type WalkingTip = 'umbrella' | 'layer' | 'perfect';

/** One short tip for a day out, from the real forecast: rain first, then a cold morning. */
export function walkingTip(forecast: Pick<DailyForecast, 'min' | 'rainChance'>): WalkingTip {
  if (forecast.rainChance !== null && forecast.rainChance >= 50) return 'umbrella';
  if (forecast.min <= 10) return 'layer';
  return 'perfect';
}
