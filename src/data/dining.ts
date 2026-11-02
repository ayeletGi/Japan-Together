/**
 * 100% vegan restaurants from the original plan (RESTAURANTS + FOOD_HOURS), merged per place.
 * Ratings, hours and prices are kept as recorded in the plan; it does not document where the
 * ratings came from or when they were checked, so the UI always labels them as unverified.
 * Chabad meals are a separate, confirmed track and are not listed here.
 * Places added on 13.10.2026 carry a `check` with the source they were verified against; only
 * restaurants whose whole menu is vegan are added, never places with vegan options.
 * We don't like curry or Indian food: no curry houses or Indian places, and curry is left out
 * of the dish descriptions.
 */

import { searchUrl } from '../lib/maps';
import type { MoreLink, SourceCheck } from './types';

export type CityId = 'tokyo' | 'kobe' | 'osaka' | 'kyoto';
export type FoodType = 'ramen' | 'sushi' | 'japanese' | 'chinese' | 'cafe' | 'burger' | 'other';

/**
 * Where we heard about a place: our Google My Maps food map, the meal-plan files in Drive,
 * the vegan list shared in the Facebook group "יפן - טיפים ועזרה למטיילים", HappyCow, or Claude
 * (found on the place's own site). The map itself is not readable from here: a place counts as
 * "map" when the Drive meal plan did not flag it "NEW - ADD TO MAP".
 */
export type FoodSource = 'map' | 'drive' | 'facebook' | 'happycow' | 'claude';
export const foodSources: FoodSource[] = ['map', 'drive', 'facebook', 'happycow', 'claude'];

export type ZoneId =
  | 'tokyo_station'
  | 'toranomon'
  | 'ginza'
  | 'toyosu'
  | 'shinjuku'
  | 'shibuya'
  | 'ebisu'
  | 'harajuku'
  | 'tanimachi'
  | 'shinsaibashi'
  | 'honmachi'
  | 'umeda'
  | 'kyoto_center'
  | 'kyoto_station'
  | 'gion'
  | 'okazaki'
  | 'motomachi'
  | 'kobe_center'
  | 'maihama'
  | 'narita';

export const zoneNames: Record<ZoneId, string> = {
  tokyo_station: 'תחנת Tokyo',
  toranomon: 'Toranomon',
  ginza: 'Ginza',
  toyosu: 'Toyosu',
  shinjuku: 'Shinjuku',
  shibuya: 'Shibuya',
  ebisu: 'Ebisu',
  harajuku: 'Harajuku / Omotesando',
  tanimachi: 'Tanimachi',
  shinsaibashi: 'Shinsaibashi',
  honmachi: 'Honmachi',
  umeda: 'Umeda',
  kyoto_center: 'מרכז קיוטו',
  kyoto_station: 'תחנת Kyoto',
  gion: 'Gion',
  okazaki: 'Okazaki / Higashiyama',
  motomachi: 'Motomachi',
  kobe_center: 'מרכז קובה',
  maihama: 'Maihama',
  narita: 'שדה התעופה נריטה',
};

/** AREA_NEAR in the original plan: neighbourhoods close enough to suggest as alternatives. */
const nearbyZones: Partial<Record<ZoneId, ZoneId[]>> = {
  tokyo_station: ['ginza', 'toranomon'],
  toyosu: ['ginza'],
  ginza: ['tokyo_station', 'toranomon'],
  toranomon: ['ginza', 'tokyo_station'],
  shibuya: ['harajuku', 'ebisu'],
  harajuku: ['shibuya'],
  ebisu: ['shibuya'],
  shinjuku: ['harajuku'],
  gion: ['kyoto_center', 'okazaki'],
  kyoto_center: ['gion', 'kyoto_station'],
  kyoto_station: ['kyoto_center'],
  okazaki: ['gion'],
  shinsaibashi: ['honmachi', 'tanimachi', 'umeda'],
  honmachi: ['shinsaibashi', 'umeda'],
  tanimachi: ['shinsaibashi'],
  umeda: ['shinsaibashi', 'honmachi'],
  motomachi: ['kobe_center'],
  kobe_center: ['motomachi'],
};

/** NEIGHBORHOOD in the original plan: the main area of each day, used when a meal has no planned place. */
export const dayZones: Partial<Record<string, ZoneId>> = {
  '2037-11-03': 'tokyo_station',
  '2037-11-04': 'toyosu',
  '2037-11-05': 'tokyo_station',
  '2037-11-06': 'motomachi',
  '2037-11-07': 'kobe_center',
  '2037-11-08': 'shinsaibashi',
  '2037-11-09': 'gion',
  '2037-11-10': 'umeda',
  '2037-11-11': 'shinsaibashi',
  '2037-11-12': 'shibuya',
  '2037-11-13': 'shinjuku',
  '2037-11-14': 'shinjuku',
  '2037-11-15': 'shibuya',
  '2037-11-16': 'maihama',
  '2037-11-17': 'maihama',
  '2037-11-18': 'narita',
};

export const zoneCity: Record<ZoneId, CityId | 'disney'> = {
  tokyo_station: 'tokyo',
  toranomon: 'tokyo',
  ginza: 'tokyo',
  toyosu: 'tokyo',
  shinjuku: 'tokyo',
  shibuya: 'tokyo',
  ebisu: 'tokyo',
  harajuku: 'tokyo',
  tanimachi: 'osaka',
  shinsaibashi: 'osaka',
  honmachi: 'osaka',
  umeda: 'osaka',
  kyoto_center: 'kyoto',
  kyoto_station: 'kyoto',
  gion: 'kyoto',
  okazaki: 'kyoto',
  motomachi: 'kobe',
  kobe_center: 'kobe',
  maihama: 'disney',
  narita: 'tokyo',
};

export interface Restaurant {
  id: string;
  name: string;
  city: CityId;
  zone: ZoneId;
  type: FoodType;
  food: string;
  /** Hours as listed in the original plan (RESTAURANTS). */
  hours: string;
  /** The original plan's separate hours table (FOOD_HOURS), when it has an entry for this place. */
  plannerHours?: { hours: string; note: string; link: string };
  /** Rating from the original plan; source and check date unknown. */
  rating: number | null;
  website: string;
  mapsQuery: string;
  /** Planned meals in the itinerary at this place. */
  eventIds: string[];
  /** A confirmed reservation that must never be swapped automatically. */
  booked?: string;
  /** Added after the original plan: where the place and its hours were checked. */
  check?: SourceCheck;
  /** Where we heard about the place, in the order we heard it. */
  sources: FoodSource[];
}

export const restaurants: Restaurant[] = [
  {
    id: 'ts-tantan',
    name: 'T’s Tantan',
    city: 'tokyo',
    zone: 'tokyo_station',
    type: 'ramen',
    food: 'ראמן שומשום, גיוזה וארוחות נודלס',
    hours: '10:00–22:00',
    plannerHours: {
      hours: '10:00–22:00',
      note: 'לפי התכנון; לבדיקת שעות ביום הביקור',
      link: searchUrl('Ts Tantan Gransta Tokyo'),
    },
    rating: 4.6,
    website: searchUrl('Ts Tantan Gransta Tokyo'),
    mapsQuery: "T's Tantan Gransta Tokyo",
    eventIds: ['d3-04', 'd15-04'],
    sources: ['map', 'drive', 'facebook'],
  },
  {
    id: 'tsuminaki',
    name: 'TSUMINAKI Mapo Tofu',
    city: 'tokyo',
    zone: 'toranomon',
    type: 'chinese',
    food: 'מאפו טופו חריף בסגנון סצ׳ואן',
    hours: '11:00–15:00, 17:00–22:00',
    plannerHours: {
      hours: '11:00–15:00 / 17:00–22:02',
      note: 'הזמנה אחרונה 21:30 לפי התכנון. שעת הסגירה 22:02 נראית כטעות הקלדה במקור — לבדוק.',
      link: searchUrl('TSUMINAKI Mapo Tofu Toranomon'),
    },
    rating: 4.8,
    website: searchUrl('TSUMINAKI Mapo Tofu Tokyo'),
    mapsQuery: 'TSUMINAKI Mapo Tofu Toranomon Tokyo',
    eventIds: ['d3-05'],
    sources: ['map', 'drive'],
  },
  {
    id: 'komeda-is',
    name: 'KOMEDA is',
    city: 'tokyo',
    zone: 'ginza',
    type: 'cafe',
    food: 'סנדוויצ׳ים, קינוחים וקפה טבעוני',
    hours: '07:00–22:00',
    plannerHours: {
      hours: '07:00–22:00',
      note: 'הזמנה אחרונה 21:30 · מקור רשמי',
      link: 'https://www.komeda-is.com/',
    },
    rating: 4.2,
    website: 'https://www.komeda-is.com/',
    mapsQuery: 'KOMEDA is Higashi Ginza Tokyo',
    eventIds: ['d4-04'],
    sources: ['map', 'drive'],
  },
  {
    id: 'uzu-tokyo',
    name: 'Vegan Ramen UZU Tokyo',
    city: 'tokyo',
    zone: 'toyosu',
    type: 'ramen',
    food: 'ראמן טבעוני ואמנות בתוך מתחם teamLab',
    hours: '10:30–21:00; ראמן החל מ־11:00',
    plannerHours: {
      hours: '10:30–21:30',
      note: 'הגשת ראמן לפי תכנון 11:00–21:00',
      link: 'https://vegan-uzu.com/pages/uzu-tokyo-en',
    },
    rating: 4.1,
    website: 'https://vegan-uzu.com/pages/uzu-tokyo-en',
    mapsQuery: 'Vegan Ramen UZU Tokyo teamLab Planets',
    eventIds: ['d4-02'],
    sources: ['map', 'drive'],
  },
  {
    id: 'ain-soph-shinjuku',
    name: 'AIN SOPH. Journey Shinjuku',
    city: 'tokyo',
    zone: 'shinjuku',
    type: 'cafe',
    food: 'פנקייקים, מנות יפניות וביסטרו טבעוני',
    hours: '11:30–15:30/16:00, 18:00–21:00',
    plannerHours: {
      hours: '11:30–16:00 / 18:00–21:30',
      note: 'הזמנה אחרונה בצהריים 15:30 לפי התכנון',
      link: searchUrl('AIN SOPH Journey Shinjuku'),
    },
    rating: 4.3,
    website: 'https://www.ain-soph.jp/',
    mapsQuery: 'AIN SOPH Journey Shinjuku',
    eventIds: ['d13-03'],
    sources: ['map', 'drive'],
  },
  {
    id: 'healthytokyo',
    name: 'HealthyTOKYO Shinjuku',
    city: 'tokyo',
    zone: 'shinjuku',
    type: 'cafe',
    food: 'קפה, כריכים טבעוניים ואוכל קל',
    hours: '08:00–21:00 לפי התכנון',
    plannerHours: {
      hours: '08:00–21:00',
      note: 'לפי התכנון',
      link: searchUrl('HealthyTOKYO Shinjuku Marui'),
    },
    rating: null,
    website: 'https://healthytokyo.com/',
    mapsQuery: 'HealthyTOKYO Shinjuku Marui Honkan',
    eventIds: ['d13-01'],
    sources: ['drive'],
  },
  {
    id: 'vegan-sushi-tokyo',
    name: 'Vegan Sushi Tokyo',
    city: 'tokyo',
    zone: 'shibuya',
    type: 'sushi',
    food: 'סושי יצירתי טבעוני; רצוי להזמין',
    hours: 'צהריים 11:30–14:30, ערב בחלק מהימים עד 20:15',
    plannerHours: {
      hours: '11:30–15:30 / 17:00–21:00',
      note: 'הזמנות אחרונות 14:45 / 20:30 לפי התכנון',
      link: searchUrl('Vegan Sushi Tokyo Shibuya'),
    },
    rating: 4.8,
    website: searchUrl('Vegan Sushi Tokyo Shoto'),
    mapsQuery: 'Vegan Sushi Tokyo Shibuya',
    eventIds: ['d12-03'],
    sources: ['map', 'drive'],
  },
  {
    id: 'sushi-babylon',
    name: 'Vegan Sushi BABYLON',
    city: 'tokyo',
    zone: 'shinjuku',
    type: 'sushi',
    food: 'ניגירי טבעוני, טמפורה וארוחות טעימות; להזמין מראש',
    hours: '12:00–23:00 ברוב הימים',
    plannerHours: {
      hours: '12:00–23:00',
      note: 'לפי התכנון; מומלץ מאוד להזמין',
      link: searchUrl('Vegan Sushi Babylon Shinjuku'),
    },
    rating: 4.7,
    website: 'https://www.tablecheck.com/en/sushi-babylon',
    mapsQuery: 'Vegan Sushi BABYLON Shinjuku Tokyo',
    eventIds: ['d14-02'],
    sources: ['drive'],
  },
  {
    id: 'hemp-cafe',
    name: 'Hemp Cafe Tokyo',
    city: 'tokyo',
    zone: 'ebisu',
    type: 'other',
    food: 'קערות, מנות טבעוניות בסגנון פיוז׳ן',
    hours: '11:30–15:00, 18:00–22:00 (לפי יום)',
    plannerHours: {
      hours: '11:30–15:00 / 18:00–22:00',
      note: 'סגור שלישי לפי התכנון',
      link: searchUrl('Hemp Cafe Tokyo Ebisu'),
    },
    rating: 4.6,
    website: searchUrl('Hemp Cafe Tokyo Ebisu'),
    mapsQuery: 'Hemp Cafe Tokyo Ebisu',
    eventIds: ['d15-03'],
    sources: ['map', 'drive'],
  },
  {
    id: 'brown-rice',
    name: 'Brown Rice Omotesando',
    city: 'tokyo',
    zone: 'harajuku',
    type: 'japanese',
    food: 'סטים טבעוניים עם אורז חום וירקות עונתיים',
    hours: '11:30–18:00, הזמנה אחרונה 17:00',
    plannerHours: {
      hours: '11:30–18:00',
      note: 'אוכל עד 17:00; סגור שלישי הראשון בחודש לפי התכנון',
      link: searchUrl('Brown Rice Tokyo Omotesando'),
    },
    rating: null,
    website: 'https://www.brownrice.jp/en/',
    mapsQuery: 'Brown Rice Tokyo Omotesando',
    eventIds: ['d12-02'],
    sources: ['map', 'drive'],
  },
  {
    id: 'mercy',
    name: 'MERCY Vegan Factory',
    city: 'osaka',
    zone: 'tanimachi',
    type: 'japanese',
    food: 'אוכל יפני, בנטו, סושי, קימבאפ וקינוחים',
    hours: '08:00–17:00; 18:00–21:00 (סגור שבת)',
    plannerHours: {
      hours: '08:00–10:30 / 10:30–17:00 / 18:00–21:00',
      note: 'הזמנה אחרונה בערב 20:00; סגור שבת · מקור רשמי',
      link: 'https://www.mercy-vegan.jp/restaurants/',
    },
    rating: 4.8,
    website: 'https://www.mercy-vegan.jp/',
    mapsQuery: 'MERCY Vegan Factory Osaka Honten',
    eventIds: ['d8-03', 'd9-01'],
    sources: ['map', 'drive'],
  },
  {
    id: 'shojin-minamo',
    name: 'Shojin Sushi Minamo',
    city: 'osaka',
    zone: 'shinsaibashi',
    type: 'sushi',
    food: 'סושי שוג׳ין טבעוני ויפני מסורתי',
    hours: '17:30–21:30 (סגור ד׳–ה׳)',
    plannerHours: {
      hours: '17:30–21:30',
      note: 'הזמנה אחרונה 21:00; סגור רביעי/חמישי לפי התכנון',
      link: searchUrl('Shojin Sushi Minamo Osaka'),
    },
    rating: null,
    website: searchUrl('Shojin Sushi Minamo Osaka'),
    mapsQuery: 'Shojin Sushi Minamo Osaka Shinsaibashi',
    eventIds: ['d8-06'],
    sources: ['drive'],
  },
  {
    id: 'green-earth',
    name: 'Green Earth Osaka',
    city: 'osaka',
    zone: 'honmachi',
    type: 'cafe',
    food: 'קערות, מנות ביתיות ומאפים טבעוניים',
    hours: '11:30–16:30 (שעות משתנות לפי יום)',
    plannerHours: {
      hours: '11:30–17:00',
      note: 'הזמנה אחרונה 16:30 לפי התכנון',
      link: searchUrl('Green Earth Osaka Vegan'),
    },
    rating: 4.7,
    website: searchUrl('Green Earth Osaka Vegan'),
    mapsQuery: 'Green Earth Osaka Vegan',
    eventIds: ['d11-02'],
    sources: ['map', 'drive'],
  },
  {
    id: 'secondroom',
    name: 'THE SECONDROOM Vegan & Gluten Free',
    city: 'osaka',
    zone: 'umeda',
    type: 'japanese',
    food: 'טאקויאקי, אוקונומיאקי, קושיקאצו טבעוניים',
    hours: '11:00–22:00 (סגור ד׳)',
    plannerHours: {
      hours: '11:00–22:00',
      note: 'הזמנה אחרונה 21:30, סגור רביעי לפי התכנון',
      link: searchUrl('Vegan Gluten Free Osaka THE SECONDROOM'),
    },
    rating: null,
    website: 'https://www.happycow.net/reviews/vegan-and-glutenfree-osaka-384115',
    mapsQuery: 'Vegan & Gluten Free Osaka THE SECONDROOM',
    eventIds: ['d10-08'],
    sources: ['drive'],
  },
  {
    id: 'uzu-kyoto',
    name: 'UZU Kyoto',
    city: 'kyoto',
    zone: 'kyoto_center',
    type: 'ramen',
    food: 'ראמן / חוויית טעימות אמנותית',
    hours: '12:00–14:45; 17:30–22:15',
    plannerHours: {
      hours: '12:00–14:45 / 17:30–22:15',
      note: 'כניסה אחרונה 13:30 / 21:00; הזמנה שלכן 18:00',
      link: 'https://vegan-uzu.com/pages/uzu-kyoto-en',
    },
    rating: 4.3,
    website: 'https://vegan-uzu.com/pages/uzu-kyoto-en',
    mapsQuery: '146 Umenokicho, Nakagyo Ward, Kyoto 604-0905, Japan',
    eventIds: ['d9-05'],
    booked: '9.11 · 18:00 · אושר לשתיכן',
    sources: ['map', 'drive'],
  },
  {
    id: 'zirael',
    name: 'ZIRAEL Vegan Restaurant',
    city: 'kyoto',
    zone: 'gion',
    type: 'japanese',
    food: 'ארוחת צהריים טבעונית בסגנון יפני מקומי',
    hours: '12:00–15:00 לפי מסמך התכנון',
    plannerHours: {
      hours: '12:00–15:00',
      note: 'עשויים לסגור כשנגמר האוכל',
      link: searchUrl('ZIRAEL Vegan Restaurant Kyoto'),
    },
    rating: null,
    website: searchUrl('ZIRAEL Vegan Kyoto'),
    mapsQuery: 'ZIRAEL Vegan Restaurant Kyoto Gion',
    eventIds: ['d9-04'],
    sources: ['drive', 'facebook'],
  },
  {
    id: 'ain-soph-kyoto',
    name: 'AIN SOPH. Journey Kyoto',
    city: 'kyoto',
    zone: 'kyoto_center',
    type: 'cafe',
    food: 'מנות ביסטרו טבעוניות וקינוחים, ברחוב Shinkyogoku ליד Shijo',
    hours: '11:30–16:00 (הזמנה אחרונה 15:00); ערב 17:00–21:00 רק בחלק מהימים; ימי סגירה לא קבועים',
    rating: null,
    website: 'https://www.ain-soph.jp/journey-kyoto',
    mapsQuery: 'AIN SOPH Journey Kyoto',
    eventIds: [],
    check: {
      date: '2037-10-13',
      link: 'https://www.ain-soph.jp/journey-kyoto',
      official: true,
    },
    sources: ['claude', 'facebook'],
  },
  {
    id: 'ain-soph-ginza',
    name: 'AIN SOPH. GINZA',
    city: 'tokyo',
    zone: 'ginza',
    type: 'cafe',
    food: 'הסניף הראשון של הרשת: ביסטרו טבעוני בקומות 2–4 ופטיסרי טבעונית בקומה 1',
    hours:
      'צהריים 11:30–16:00 (הזמנה אחרונה 15:00), ערב 17:00–21:00 (הזמנה אחרונה 20:00); פטיסרי 11:30–20:30',
    rating: null,
    website: 'https://www.ain-soph.jp/ginza',
    mapsQuery: 'AIN SOPH. GINZA 4-12-1 Ginza Tokyo',
    eventIds: [],
    check: {
      date: '2037-10-13',
      link: 'https://www.ain-soph.jp/ginza',
      official: true,
    },
    sources: ['claude'],
  },
  {
    id: 'jangara-vegan',
    name: 'Vegan Bistro Jangara',
    city: 'tokyo',
    zone: 'harajuku',
    type: 'ramen',
    food: 'ביסטרו טבעוני של רשת Kyushu Jangara: ראמן טנטנמן, גיוזה ובורגרים. לא לבלבל עם סניף הראמן הרגיל של הרשת באזור',
    hours: '11:00–22:00 (הזמנה אחרונה 21:00); בלי הזמנות מקום',
    rating: null,
    website: 'https://kyushujangara.co.jp/shops/veganbistro/',
    mapsQuery: 'Vegan Bistro Jangara 1-13-21 Jingumae Shibuya Tokyo',
    eventIds: [],
    check: {
      date: '2037-10-13',
      link: 'https://kyushujangara.co.jp/shops/veganbistro/',
      official: true,
    },
    sources: ['claude'],
  },
  {
    id: 'nuts-exchange',
    name: 'The Nuts Exchange',
    city: 'tokyo',
    zone: 'shibuya',
    type: 'cafe',
    food: 'בית קפה טבעוני עם חלב מקדמיה, מאפים ללא גלוטן וסט צהריים; ב־Tomigaya, הליכה מ־Yoyogi-koen',
    hours: '09:30–21:00, ראשון וחגים עד 18:00, סגור שני',
    rating: null,
    website: 'https://www.timeout.com/tokyo/restaurants/the-nuts-exchange',
    mapsQuery: 'The Nuts Exchange 1-51-1 Tomigaya Shibuya Tokyo',
    eventIds: [],
    check: {
      date: '2037-10-13',
      source: 'Time Out (2023) · HappyCow',
      link: 'https://www.timeout.com/tokyo/restaurants/the-nuts-exchange',
      official: false,
    },
    sources: ['happycow'],
  },
  {
    id: 'oko-takoyaki',
    name: 'OKO Takoyaki',
    city: 'osaka',
    zone: 'shinsaibashi',
    type: 'japanese',
    food: 'טאקויאקי וקושיקאצו טבעוניים לגמרי (מאז 2023), בלי גלוטן. מקום קטן עם טבחית אחת — כדאי להגיע סמוך לפתיחה',
    hours: 'ערב בלבד, בערך 18:00–23:00 כל יום (הזמנה אחרונה 22:45)',
    rating: null,
    website: 'https://www.happycow.net/reviews/oko-takoyaki-osaka-363992',
    mapsQuery: 'OKO takoyaki vegan 1-15-24 Higashishinsaibashi Osaka',
    eventIds: [],
    check: {
      date: '2037-10-13',
      source: 'HappyCow',
      link: 'https://www.happycow.net/reviews/oko-takoyaki-osaka-363992',
      official: false,
    },
    sources: ['happycow'],
  },
  {
    id: 'sukhasana',
    name: 'SUKHASANA Vegan Pizzeria',
    city: 'osaka',
    zone: 'tanimachi',
    type: 'other',
    food: 'פיצרייה טבעונית לגמרי ליד Matsuyamachi, בין Tanimachi ל־Shinsaibashi',
    hours: 'ב׳–ש׳ 15:00–22:00, א׳ 17:00–21:00 (לפי אתר רשימות; לאמת באינסטגרם)',
    rating: null,
    website: 'https://www.happycow.net/reviews/unique-pizzeria-sukhasana-osaka-236386',
    mapsQuery: 'SUKHASANA vegan pizzeria 5-24 Matsuyamachi Sumiyoshi Chuo Osaka',
    eventIds: [],
    check: {
      date: '2037-10-13',
      source: 'HappyCow · Spinach',
      link: 'https://www.happycow.net/reviews/unique-pizzeria-sukhasana-osaka-236386',
      official: false,
    },
    sources: ['happycow'],
  },
  {
    id: 'tu-casa',
    name: 'TU CASA (Plant based & Zero waste)',
    city: 'kyoto',
    zone: 'gion',
    type: 'cafe',
    food: 'קפה צמחי־טבעוני קטן ב־Miyagawa-cho, ממש ליד גיון; יש רשימת המתנה',
    hours: 'השעות משתנות מאוד בין המקורות — לבדוק באינסטגרם שלהם לפני',
    rating: null,
    website: 'https://www.happycow.net/reviews/tu-casa-kyoto-315360',
    mapsQuery: 'TU CASA plant based zero waste Kyoto Miyagawacho',
    eventIds: [],
    check: {
      date: '2037-10-13',
      source: 'HappyCow',
      link: 'https://www.happycow.net/reviews/tu-casa-kyoto-315360',
      official: false,
    },
    sources: ['happycow'],
  },
  {
    id: 'veggie-junkies',
    name: 'Veggie Junkies Burger',
    city: 'kobe',
    zone: 'motomachi',
    type: 'burger',
    food: 'המבורגרים, צ׳יפס ומנות טייק־אוויי טבעוניות',
    hours: '11:00–17:00 (סגור ה׳ לפי התכנון)',
    plannerHours: {
      hours: '11:00–17:00',
      note: 'סגור חמישי לפי התכנון',
      link: searchUrl('Veggie Junkies Burger Kobe'),
    },
    rating: null,
    website: searchUrl('Veggie Junkies Burger Motomachi'),
    mapsQuery: 'Veggie Junkies Burger Barom Kobe Motomachi',
    eventIds: ['d6-02'],
    sources: ['drive'],
  },
  {
    id: 'vegan-bread-4690',
    name: 'Vegan Bread 4690',
    city: 'kobe',
    zone: 'kobe_center',
    type: 'cafe',
    food: 'מאפייה טבעונית, כריכים ומאפים קלים',
    hours: 'שבת ~09:30–20:00 לפי התכנון',
    plannerHours: {
      hours: '09:30–20:00',
      note: 'שבת; שעות מקור התכנון לא אומתו מחדש',
      link: searchUrl('Vegan Bread 4690 Kobe'),
    },
    rating: null,
    website: searchUrl('Vegan Bread 4690 Kobe'),
    mapsQuery: 'Vegan Bread 4690 Kobe',
    eventIds: ['d7-02'],
    sources: ['drive'],
  },
  {
    id: 'gion-soy-ramen',
    name: 'Gion Soy Milk Ramen (Uno Yukiko)',
    city: 'kyoto',
    zone: 'gion',
    type: 'ramen',
    food: 'ראמן טבעוני לגמרי על ציר חלב סויה קרמי, שלושה סוגי קערות וגיוזה; ממש בגיון, ליד הקימונו',
    hours: 'בערך 11:00–20:30 כל יום לפי אתר רשימות; המקורות לא אחידים — לבדוק לפני',
    rating: null,
    website: 'https://www.happycow.net/reviews/uno-yukiko-gion-soy-milk-ramen-kyoto-317927',
    mapsQuery: 'Gion Soy Milk Ramen Uno Yukiko 40 Kameicho Gion Kyoto',
    eventIds: [],
    check: {
      date: '2037-11-02',
      source: 'HappyCow',
      link: 'https://www.happycow.net/reviews/uno-yukiko-gion-soy-milk-ramen-kyoto-317927',
      official: false,
    },
    sources: ['facebook'],
  },
  {
    id: 'vegan-ramen-zen',
    name: 'Vegan Ramen ZEN',
    city: 'kyoto',
    zone: 'kyoto_center',
    type: 'ramen',
    food: 'ראמן טבעוני בלי ציר מן החי, מרכיבים עונתיים; קומה 2, הליכה קצרה מ־Gion-Shijo. כ־¥3,000 לקערה',
    hours: 'לא מצאתי שעות פתיחה — להזמין או לבדוק דרך TableCheck',
    rating: null,
    website: 'https://www.tablecheck.com/veganramen-zen',
    mapsQuery: 'Vegan Ramen ZEN Kyoto Nakagyo',
    eventIds: [],
    check: {
      date: '2037-11-02',
      source: 'TableCheck',
      link: 'https://www.tablecheck.com/veganramen-zen',
      official: false,
    },
    sources: ['facebook'],
  },
  {
    id: 'choice-kyoto',
    name: 'Choice',
    city: 'kyoto',
    zone: 'okazaki',
    type: 'cafe',
    food: 'קפה־מסעדה טבעוני וללא גלוטן: כריכים, קערות וקינוחים; צפונית לגיון, ליד Heian-jingu',
    hours: 'המקורות סותרים (בערך 09:00/09:30 עד 20:30–21:00); כנראה סגור חמישי — לבדוק לפני',
    rating: null,
    website: 'https://www.happycow.net/reviews/choice-kyoto-42327',
    mapsQuery: 'Choice vegan gluten free cafe Higashiyama Kyoto',
    eventIds: [],
    check: {
      date: '2037-11-02',
      source: 'HappyCow · Inside Kyoto',
      link: 'https://insidekyoto.com/choice-northern-higashiyama',
      official: false,
    },
    sources: ['facebook'],
  },
  {
    id: 'veg-out',
    name: 'Veg Out',
    city: 'kyoto',
    zone: 'kyoto_station',
    type: 'cafe',
    food: 'בית קפה טבעוני על גדת נהר Kamo: בודהה בול, צלחת Veg Out ולאטה סויה; 2 דקות מתחנת Shichijo',
    hours: 'ג׳–א׳ בערך 09:00–18:00, סגור שני; לפעמים נסגר מוקדם כשנגמר האוכל',
    rating: null,
    website: 'https://www.happycow.net/reviews/veg-out-kyoto-63991',
    mapsQuery: 'Veg Out vegan cafe 448 Inaricho Shimogyo Kyoto',
    eventIds: [],
    check: {
      date: '2037-11-02',
      source: 'HappyCow',
      link: 'https://www.happycow.net/reviews/veg-out-kyoto-63991',
      official: false,
    },
    sources: ['facebook'],
  },
  {
    id: 'mercy-bakery-kyoto',
    name: 'MERCY Vegan Bakery Kyoto',
    city: 'kyoto',
    zone: 'kyoto_station',
    type: 'cafe',
    food: 'המאפייה הטבעונית של MERCY: גרטן פטריות, פיצה־לחם, סופגניות קינמון. טוב לארוחת בוקר כשמגיעות לקיוטו',
    hours: 'מ־07:00 ועד שהלחם נגמר; ימי סגירה משתנים — לבדוק באינסטגרם ‎@mercyveganbakery',
    rating: null,
    website: 'https://prtimes.jp/main/html/rd/p/000000026.000174572.html',
    mapsQuery: 'MERCY Vegan Bakery Hotel Elite Kyoto Station',
    eventIds: [],
    check: {
      date: '2037-11-02',
      source: 'PR Times (הודעת החברה)',
      link: 'https://prtimes.jp/main/html/rd/p/000000026.000174572.html',
      official: false,
    },
    sources: ['facebook'],
  },
  {
    id: 'veggie-joga',
    name: 'Vegan Veggie Joga',
    city: 'tokyo',
    zone: 'harajuku',
    type: 'chinese',
    food: 'מסעדה סינית טבעונית לגמרי עם צמחי מרפא: מאפו טופו (יש גרסה ירוקה לא חריפה) וסיר חם; סטים זולים בצהריים. הליכה קצרה מ־Omotesando',
    hours: 'לא מצאתי שעות עדכניות — לבדוק באינסטגרם לפני',
    rating: null,
    website: 'https://www.timeout.com/tokyo/restaurants/vegan-veggie-joga',
    mapsQuery: 'Vegan Veggie Joga 6-2-13 Minamiaoyama Minato Tokyo',
    eventIds: [],
    check: {
      date: '2037-11-02',
      source: 'Time Out · HappyCow',
      link: 'https://www.happycow.net/reviews/vegan-veggie-joga-tokyo-297870',
      official: false,
    },
    sources: ['facebook'],
  },
  {
    id: 'ts-tantan-narita',
    name: 'T’s Tantan Narita',
    city: 'tokyo',
    zone: 'narita',
    type: 'ramen',
    food: 'אותו T’s Tantan, בשדה: טרמינל 2, קומה 4, לפני הביקורת. אנחנו טסות מ־T1 — שאטל חינם בין הטרמינלים. ב־T1 יש לכל היותר דוכן טייק־אוויי',
    hours: 'בערך 07:30–21:00 (הזמנה אחרונה 20:30); דיווח אחד שהסניף ב־T2 נסגר — לבדוק לפני',
    rating: null,
    website: 'https://www.happycow.net/reviews/ts-tantan-narita-190303',
    mapsQuery: "T's Tantan Narita Airport Terminal 2",
    eventIds: [],
    check: {
      date: '2037-11-02',
      source: 'HappyCow',
      link: 'https://www.happycow.net/reviews/ts-tantan-narita-190303',
      official: false,
    },
    sources: ['facebook'],
  },
];

/** Our shared food map in Google My Maps, linked from the top of the Food tab. */
export const FOOD_MAP_URL =
  'https://www.google.com/maps/d/edit?mid=1aKqkmbivcUd8UHMRFViJltMhoRN9zhs&usp=sharing';

/** Outside lists for finding more fully vegan places. */
export const diningLinks: MoreLink[] = [
  {
    label: 'HappyCow · טוקיו',
    note: 'לסנן "Vegan" בלבד — שם מופיעים רק מקומות טבעוניים לגמרי',
    url: 'https://www.happycow.net/best-vegan-restaurants/tokyo-japan',
  },
  {
    label: 'HappyCow · אוסקה',
    note: 'כולל MERCY, Minamo ו־OKO; לסנן "Vegan"',
    url: 'https://www.happycow.net/best-vegan-restaurants/osaka-japan',
  },
  {
    label: 'HappyCow · קיוטו',
    note: 'ZIRAEL, Itadakizen, Nijiya ועוד',
    url: 'https://www.happycow.net/best-vegan-restaurants/kyoto-japan',
  },
  {
    label: 'HappyCow · קובה',
    note: 'מעט מקומות טבעוניים לגמרי בקובה; לוודא סימון Vegan ולא Veg-options',
    url: 'https://www.happycow.net/best-vegan-restaurants/kobe-japan',
  },
  {
    label: 'Fat Gay Vegan · אוכל טבעוני ב־DisneySea (יוני 2026)',
    note: 'מנות עם סימון V ירוק בתפריט הפארק',
    url: 'https://fatgayvegan.com/2026/06/04/vegan-food-inside-tokyo-disneysea/',
  },
];

export function restaurantForEvent(eventId: string): Restaurant | undefined {
  return restaurants.find((restaurant) => restaurant.eventIds.includes(eventId));
}

/** How close a restaurant is to an area, without inventing distances. */
export function proximity(restaurant: Restaurant, zone: ZoneId | undefined) {
  if (!zone) return 'other' as const;
  if (restaurant.zone === zone) return 'same' as const;
  if (nearbyZones[zone]?.includes(restaurant.zone)) return 'near' as const;
  if (zoneCity[zone] === restaurant.city) return 'city' as const;
  return 'other' as const;
}

const cityNames: Record<string, CityId> = {
  טוקיו: 'tokyo',
  קובה: 'kobe',
  אוסקה: 'osaka',
  קיוטו: 'kyoto',
};

/**
 * The restaurant cities in a day's place ("קובה → אוסקה" → kobe, osaka), in order. Parts with
 * no restaurants (טיסה, דיסני, ישראל) are skipped, so a flight day gives an empty list.
 */
export function citiesIn(place: string): CityId[] {
  const found = place.split(/\s*(?:→|\/)\s*/).map((part) => cityNames[part]);
  return [...new Set(found.filter((city): city is CityId => !!city))];
}
