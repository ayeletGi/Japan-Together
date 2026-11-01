import { describe, expect, it } from 'vitest';
import { weatherPlaces } from '../src/data/weather';
import { forecastSiteUrl } from '../src/lib/forecastSite';

const osaka = weatherPlaces['2037-11-08'];
const dayParam = (date: string, today: string) =>
  new URL(forecastSiteUrl(osaka, date, today, 'he')).searchParams.get('day');

describe('forecastSiteUrl', () => {
  it("opens the city's AccuWeather page in the app's language", () => {
    expect(forecastSiteUrl(osaka, '2037-11-08', '2037-11-08', 'en')).toBe(
      'https://www.accuweather.com/en/jp/osaka-shi/225007/daily-weather-forecast/225007?day=1',
    );
  });

  it('counts the day from today in Japan, today being day 1', () => {
    expect(dayParam('2037-11-08', '2037-10-25')).toBe('15');
    expect(dayParam('2037-11-08', '2037-11-07')).toBe('2');
  });

  it('a day already gone opens today', () => {
    expect(dayParam('2037-11-08', '2037-11-10')).toBe('1');
  });
});
