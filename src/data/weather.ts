/** Where to read the forecast for each day (the original plan's WEATHER_CITIES, chosen per day's main area). */

export interface WeatherPlace {
  name: string;
  label: string;
  lat: number;
  lon: number;
  /** AccuWeather's page for the city: its URL slug and location key (looked up from lat/lon). */
  accuWeather: { slug: string; key: number };
}

const tokyo: WeatherPlace = {
  name: 'Tokyo',
  label: 'טוקיו',
  lat: 35.6762,
  lon: 139.6503,
  accuWeather: { slug: 'tokyo', key: 226396 },
};
const kobe: WeatherPlace = {
  name: 'Kobe',
  label: 'קובה',
  lat: 34.6901,
  lon: 135.1955,
  accuWeather: { slug: 'kobe-shi', key: 224023 },
};
const osaka: WeatherPlace = {
  name: 'Osaka',
  label: 'אוסקה',
  lat: 34.6937,
  lon: 135.5023,
  accuWeather: { slug: 'osaka-shi', key: 225007 },
};
const kyoto: WeatherPlace = {
  name: 'Kyoto',
  label: 'קיוטו',
  lat: 35.0116,
  lon: 135.7681,
  accuWeather: { slug: 'kyoto-shi', key: 224436 },
};
const urayasu: WeatherPlace = {
  name: 'Urayasu',
  label: 'מפרץ טוקיו',
  lat: 35.636,
  lon: 139.882,
  accuWeather: { slug: 'urayasu-shi', key: 216947 },
};

export const weatherPlaces: Record<string, WeatherPlace> = {
  '2037-11-02': tokyo,
  '2037-11-03': tokyo,
  '2037-11-04': tokyo,
  '2037-11-05': tokyo,
  '2037-11-06': kobe,
  '2037-11-07': kobe,
  '2037-11-08': osaka,
  '2037-11-09': kyoto,
  '2037-11-10': osaka,
  '2037-11-11': osaka,
  '2037-11-12': tokyo,
  '2037-11-13': tokyo,
  '2037-11-14': tokyo,
  '2037-11-15': tokyo,
  '2037-11-16': urayasu,
  '2037-11-17': urayasu,
  '2037-11-18': urayasu,
};
