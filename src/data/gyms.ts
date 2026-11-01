/**
 * Strength training: two sessions per trip week, Saturday nights (after Shabbat) first.
 * From the original plan (GYMS_RECS). "verified" means the plan records the visitor entry as checked against the gym's
 * own terms; everything else must be confirmed with the branch before relying on it.
 * Gyms with a `check` were added on 13.10.2026 from the source named there.
 */

import type { MoreLink, SourceCheck } from './types';

export type GymAccess = 'guests' | 'visitor' | 'unverified';

export type GymCity = 'tokyo' | 'kobe' | 'osaka';

export interface Gym {
  id: string;
  city: GymCity;
  /** Trip date, or null for an alternative without a fixed day. */
  date: string | null;
  dateLabel: string;
  name: string;
  role: string;
  hours: string;
  /** One-time entry price in yen as listed in the original plan; `0` for hotel guests, `null` when unknown. */
  priceJpy: number | null;
  access: GymAccess;
  accessNote: string;
  women: string;
  website: string;
  near: string;
  mapsQuery: string;
  saturdayNight: boolean;
  /** Matching itinerary event, if the session is on the timeline. */
  eventId?: string;
  /** Trip week for an alternative without a date (defaults to week 2). */
  week?: 1 | 2;
  /** Added after the original plan: where the details were checked. */
  check?: SourceCheck;
}

export const gyms: Gym[] = [
  {
    id: 'shinagawa-prince',
    city: 'tokyo',
    date: '2037-11-04',
    dateLabel: '4.11',
    name: 'Shinagawa Prince Fitness Room',
    role: 'אימון 1/2 · שבוע ראשון',
    hours: '24 שעות, לאורחות המלון',
    priceJpy: 0,
    access: 'guests',
    accessNote: 'חינם לאורחות המלון לפי תנאי המתקן; כניסה בכרטיס חדר, 18+',
    women: 'מעורב',
    website: 'https://www.princehotels.com/shinagawa/facilities/fitness-room/',
    near: 'במלון — Main Tower קומה 4',
    mapsQuery: 'Shinagawa Prince Hotel Main Tower',
    saturdayNight: false,
    eventId: 'gym-2037-11-04',
  },
  {
    id: 'golds-kobe',
    city: 'kobe',
    date: '2037-11-07',
    dateLabel: '7.11',
    name: 'Gold’s Gym Kobe Motomachi',
    role: 'מוצ״ש בעדיפות · שבוע ראשון',
    hours: 'שבת 07:00–23:00; אימון מוצע 19:30–20:45 אחרי הבדלה',
    priceJpy: null,
    access: 'unverified',
    accessNote:
      'פתוח בשבת עד 23:00 ויש אזור לנשים; תנאי תיירת וכניסה חד־פעמית לא אומתו. יש ליצור קשר עם הסניף לפני הטיול.',
    women: 'אזור נשים, שאר המקום מעורב',
    website: 'https://www.goldsgym.jp/shop/kobe-motomachi/',
    near: 'אזור Motomachi בקובה, סמוך לאזור המלון',
    mapsQuery: 'Golds Gym Kobe Motomachi 47 Akashimachi Kobe',
    saturdayNight: true,
    eventId: 'gym-kobe-motzash',
  },
  {
    id: 'golds-shinsaibashi',
    city: 'osaka',
    date: '2037-11-08',
    dateLabel: '8.11',
    name: 'Gold’s Gym Shinsaibashi Osaka',
    role: 'גיבוי לשבוע הראשון · אם אין כניסה במוצ״ש 7.11',
    hours: 'יום ראשון 09:00–22:00 לפי שעות הסניף',
    priceJpy: 2860,
    access: 'unverified',
    accessNote:
      'חלופה בלבד לאימון מוצ״ש בקובה; לא אימון שלישי מחייב. כניסה חד־פעמית עם דרכון — לבדוק מול הסניף.',
    women: 'מעורב',
    website: 'https://www.goldsgym.jp/shop/shinsaibashi-osaka/membership/',
    near: 'אזור Shinsaibashi ליד Dotonbori',
    mapsQuery: 'Golds Gym Shinsaibashi Osaka',
    saturdayNight: false,
  },
  {
    id: 'golds-omori-14',
    city: 'tokyo',
    date: '2037-11-14',
    dateLabel: '14.11',
    name: 'Gold’s Gym South Tokyo ANNEX',
    role: 'מוצ״ש בעדיפות · שבוע שני',
    hours: 'שבת עד 23:30; אימון מוצע 19:30–20:45 אחרי צאת שבת',
    priceJpy: 3080,
    access: 'visitor',
    accessNote: 'רק אחרי צאת שבת והבדלה; לא הזמנה',
    women: 'מעורב',
    website: 'https://www.goldsgym.jp/shop/south-tokyo-annex/membership/',
    near: 'ליד תחנת Omori',
    mapsQuery: 'Golds Gym South Tokyo ANNEX Omori',
    saturdayNight: true,
    eventId: 'gym-2037-11-14',
  },
  {
    id: 'golds-higashi-nakano',
    city: 'tokyo',
    date: null,
    dateLabel: 'חלופה לשבוע שני',
    name: 'Gold’s Gym Higashi-Nakano Tokyo',
    role: 'אפשרות עם אזור נשים',
    hours: 'לבדוק שעות בסניף',
    priceJpy: 3300,
    access: 'visitor',
    accessNote:
      'כניסה חד־פעמית עם דרכון. יש אזור אימון לנשים בלבד כולל מתקני כוח ו־Booty Builder, אבל יתר חדר הכושר מעורב.',
    women: 'אזור לנשים בלבד',
    website: 'https://www.goldsgym.jp/shop/higashi-nakano-tokyo/',
    near: 'ליד Nakano / Shinjuku — צריך לנסוע',
    mapsQuery: 'Golds Gym Higashi-Nakano Tokyo',
    saturdayNight: false,
  },
  {
    id: 'minato-sports',
    city: 'tokyo',
    date: null,
    dateLabel: 'חלופה לשבוע ראשון',
    week: 1,
    name: 'Minato City Sports Center',
    role: 'חדר כושר עירוני גדול וזול, תחנה אחת מ־Shinagawa — אם חדר הכושר במלון קטן מדי',
    hours: 'בערך 08:30–22:30 לפי האתר העירוני (עודכן 2024)',
    priceJpy: 800,
    access: 'visitor',
    accessNote:
      'לפי האתר הרשמי, מי שלא גרה ב־Minato קונה כרטיס חד־פעמי במכונה ב־¥800 בלי הרשמה. צריך נעלי ספורט נקיות לפנים, בגדי אימון ומגבת.',
    women: 'מעורב',
    website: 'https://minatoku-sports.com/',
    near: 'ליד תחנות Tamachi / Mita, תחנה אחת מ־Shinagawa',
    mapsQuery: 'Minato City Sports Center Shibaura Tokyo',
    saturdayNight: false,
    check: {
      date: '2037-10-13',
      source: 'האתר העירוני (Minato)',
      link: 'https://minatoku-sports.com/',
      official: true,
    },
  },
  {
    id: 'omori-sports',
    city: 'tokyo',
    date: null,
    dateLabel: 'חלופה זולה לשבוע שני',
    week: 2,
    name: 'Omori Sports Center · Training Room',
    role: 'חדר כושר עירוני של Ota, קרוב למלון באומורי ופתוח עד 22:00 — אפשרי גם במוצ״ש 14.11',
    hours: 'כל יום 09:00–22:00',
    priceJpy: 400,
    access: 'unverified',
    accessNote:
      '¥400 לכניסה לפי עמוד העירייה (מחיר מאפריל 2026). העמוד לא מפרט אם תיירות יכולות להשתמש ואם צריך הדרכה ראשונה — לשאול בטלפון 03-5763-1311. חובה נעלי ספורט לפנים (לא סנדלים); אסור להביא ציוד אימון אישי.',
    women: 'מעורב',
    website:
      'https://www.city.ota.tokyo.jp/shisetsu/sports/oomori_s/oomorisportsc_trainingroom.html',
    near: '6 דקות הליכה מתחנת Heiwajima (Keikyu), קרוב לאומורי',
    mapsQuery: 'Omori Sports Center 2-2-5 Omorihoncho Ota Tokyo',
    saturdayNight: false,
    check: {
      date: '2037-10-13',
      source: 'אתר עיריית Ota',
      link: 'https://www.city.ota.tokyo.jp/shisetsu/sports/oomori_s/oomorisportsc_trainingroom.html',
      official: true,
    },
  },
];

/** Outside pages for gym entry rules and passes. */
export const gymLinks: MoreLink[] = [
  {
    label: 'Gold’s Gym · מידע לתיירות',
    note: 'כניסה יומית ¥2,860 (עד 5 שעות). כרטיס Traveler’s Pass ב־¥11,000 ל־10 ימים רצופים בכל סניפי Gold’s ביפן, כולל השכרת נעליים — 7.11–16.11 מכסה את קובה, שינסאיבאשי ואומורי. דרכון + כתובת המלון; קעקועים מכוסים.',
    url: 'https://www.goldsgym.jp/?p=5949',
  },
  {
    label: 'חדרי הכושר העירוניים של Ota',
    note: 'רשימת חדרי הכושר הזולים של הרובע שבו נמצא המלון באומורי',
    url: 'https://www.city.ota.tokyo.jp/shisetsu/sports/training/index.html',
  },
];
