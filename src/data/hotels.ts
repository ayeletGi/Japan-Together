import { daysBetween } from '../lib/time';
import type { Hotel } from './types';

/**
 * The five stays, check-in → check-out dates. Hours follow the `hotelSchedule` recorded in the original plan
 * (booking or official site); they are not re-verified here. Japanese names are for the taxi card:
 * Shinagawa's came from our own data; the other four follow the hotels' Japanese sites and wait
 * for our check (`JP_NAME_CHECKED`).
 */
export const hotels = {
  shinagawa: {
    id: 'shinagawa',
    name: 'Shinagawa Prince Hotel',
    mapsQuery: 'Shinagawa Prince Hotel Tokyo',
    shortName: 'Shinagawa Prince',
    area: 'tokyo',
    jpName: '品川プリンスホテル',
    city: 'טוקיו',
    checkIn: '2037-11-03',
    checkOut: '2037-11-05',
    checkInFrom: '15:00',
    checkOutBy: '11:00',
    website: 'https://www.princehotels.com/shinagawa/about-us/',
    notes: [
      'חדר כושר 24/7 לאורחות המלון ב־Main Tower, קומה 4.',
      'כביסה במטבעות: Main Tower קומה 9 (7 מכונות תוף + 7 עליונות, כביסה וייבוש). לא מתוכנן — רק אם צריך.',
    ],
    facilities: [
      'אקווריום maxell AQUA PARK בתוך מתחם המלון, עם מופע דולפינים וגם גרסת לילה (בערך ב־19:00). פתוח בערך עד 20:00.',
      'DINING & BAR TABLE 9 בקומה 39 של ה־Main Tower: בר עם נוף לטוקיו בלילה, פתוח עד מאוחר.',
      'מרכז באולינג ענק עם 80 מסלולים, קולנוע T・JOY עם IMAX ומטווח גולף מקורה.',
      '7-Eleven בתוך המתחם.',
    ],
  },
  kobe: {
    id: 'kobe',
    name: 'CANDEO HOTELS Kobe Tor Road',
    mapsQuery: 'CANDEO HOTELS Kobe Tor Road',
    shortName: 'CANDEO Kobe',
    area: 'kobe',
    jpName: 'カンデオホテルズ神戸トアロード',
    city: 'קובה',
    checkIn: '2037-11-05',
    checkOut: '2037-11-08',
    checkInFrom: '15:00',
    checkOutBy: '11:00',
    website: 'https://www.candeohotels.com/ja/hyogo-kobe/access/',
    notes: [
      'מגיעות ברכבת שמגיעה ל־Shin-Kobe ב־19:53; צ׳ק־אין משוער 20:30.',
      'כביסה במטבעות במלון — כביסה 1/2 ב־8.11 בבוקר. בצ׳ק־אין לשאול: איפה, שעות, מחיר, מזומן או אשראי, והאם יש אבקה אוטומטית.',
    ],
    facilities: [
      'SkySpa על הגג: אמבט פתוח עם נוף להרים, לים ולעיר. בצד הנשים יש אמבט פתוח, אמבט פנימי וסאונת אדים. חינם לאורחות.',
      'פתוח 15:00–11:00 למחרת (הסאונה סגורה 02:00–06:00), אז אפשר גם בלילה כשמגיעות וגם בבוקר.',
      'מגבת מביאים מהחדר. בפנים יש שמפו אורגני, מסיר איפור וטונר.',
    ],
  },
  osakaNamba: {
    id: 'osakaNamba',
    name: 'CANDEO HOTELS Osaka Namba',
    mapsQuery: 'CANDEO HOTELS Osaka Namba',
    shortName: 'CANDEO Osaka Namba',
    area: 'osaka',
    jpName: 'カンデオホテルズ大阪なんば',
    city: 'אוסקה',
    checkIn: '2037-11-08',
    checkOut: '2037-11-11',
    checkInFrom: '15:00',
    checkOutBy: '11:00',
    website: 'https://www.candeohotels.com/en/osaka-namba/',
    notes: ['כביסה במטבעות במלון. גיבוי בלבד — מכונה קטנה בבוקר 11.11 אם חסרים בגדים.'],
    facilities: [
      'SkySpa על הגג: בצד הנשים אמבט פתוח, אמבט פנימי וסאונת אדים. חינם לאורחות.',
      'פתוח 15:00–11:00 למחרת (הסאונה סגורה 02:00–06:00).',
      'מגבת מביאים מהחדר, ובגד ים אסור.',
    ],
  },
  omori: {
    id: 'omori',
    name: 'HOTEL MYSTAYS PREMIER Omori',
    mapsQuery: 'HOTEL MYSTAYS PREMIER Omori',
    shortName: 'MYSTAYS Omori',
    area: 'tokyo',
    jpName: 'ホテルマイステイズプレミア大森',
    city: 'טוקיו',
    checkIn: '2037-11-11',
    checkOut: '2037-11-15',
    checkInFrom: '15:00',
    checkOutBy: '11:00',
    website: 'https://www.mystays.com/en-us/location-hotel-mystays-premier-omori-tokyo/',
    notes: [
      'לפי אישור המלון, צ׳ק־אין אפשרי עד 05:00 — מגיעות אחרי NOZOMI 46.',
      'ב־15.11 בצ׳ק־אאוט לשלוח את המזוודות מהדלפק ב־Yamato ישר ל־Oriental Hotel (מגיעות ב־16.11).',
      'לפי ביקורת אורחים אין במלון חדר כביסה — לכן לא מתוכננת כאן כביסה. בחירום: מכבסות ציבוריות ליד תחנת Omori (לחפש ״コインランドリー״ ב־Google Maps).',
    ],
    facilities: [
      'מסעדת FOREST COAST במלון, עם ארוחת בוקר בופה 07:00–09:30 (בתשלום).',
      'אין ספא או אמבט משותף, רק אמבטיה בחדר. במרחק כ־900 מ׳ יש את אקווריום Shinagawa.',
    ],
  },
  orientalTokyoBay: {
    id: 'orientalTokyoBay',
    name: 'Oriental Hotel Tokyo Bay',
    mapsQuery: 'Oriental Hotel Tokyo Bay',
    shortName: 'Oriental Hotel',
    area: 'disney',
    jpName: 'オリエンタルホテル 東京ベイ',
    city: 'אוראיאסו',
    checkIn: '2037-11-15',
    checkOut: '2037-11-18',
    checkInFrom: '15:00',
    checkOutBy: '12:00',
    website: 'https://www.oriental-hotel.co.jp/en/',
    notes: [
      'המלון ב־Shin-Urayasu הוא Partner Hotel, לא מלון Disney רשמי במאיהמה.',
      'אין לו שירות Welcome Center חינמי למזוודות; שירות Bon Voyage נפרד בתשלום אם נחוץ.',
      'יש שאטל של המלון לפארקים — לבדוק את הלוח ערב קודם.',
      'חדר כביסה ליד הדלפק, שופץ ב־2024: אשראי או QR בלבד, בלי צורך באבקה. כביסה 2/2 ב־15.11 אחרי הצ׳ק־אין.',
    ],
    facilities: [
      'Welcome Lounge בקומה 2: בירה מהחבית, יין מבעבע, שתייה ונשנושים חינם לאורחות, בערך 14:00–23:00.',
      'הקרנת מיפוי אינטראקטיבית בלובי וקישוטים עונתיים.',
      'בופה בינלאומי Grand Cinq ובופה סיני CHINESE TABLE. יש גם פאב בריטי HUB עם הופעות.',
      'Lawson פתוח 24 שעות בתוך המלון, ושאטל חינם לדיסני עד 69 פעמים ביום, בלי הזמנה.',
    ],
  },
} satisfies Record<string, Hotel>;

export type HotelId = keyof typeof hotels;

/** Hotels whose Japanese name we confirmed ourselves. */
export const JP_NAME_CHECKED: ReadonlySet<HotelId> = new Set(['shinagawa']);

/** A hotel of this trip, so its id can open its sheet without a cast. */
export type TripHotel = Hotel & { id: HotelId };

/** In stay order; each id is its key in `hotels`. */
export const hotelList: TripHotel[] = (Object.keys(hotels) as HotelId[]).map((id) => ({
  ...hotels[id],
  id,
}));

/** The hotel slept in on the night of `date`, if any (none on the two flight nights). */
export function hotelForNight(date: string): TripHotel | undefined {
  return hotelList.find((hotel) => date >= hotel.checkIn && date < hotel.checkOut);
}

/** The hotel the day starts from: last night's hotel, or tonight's on arrival day. */
export function hotelForMorning(date: string): TripHotel | undefined {
  return hotelList.find((hotel) => date > hotel.checkIn && date <= hotel.checkOut);
}

export function nights(hotel: Hotel): number {
  return daysBetween(hotel.checkIn, hotel.checkOut);
}

/** The hotel at a place written in the trip data ("Shinagawa Prince Hotel, Tokyo"), if any. */
export function hotelAt(place: string): TripHotel | undefined {
  const text = place.toLowerCase();
  return hotelList.find((hotel) => text.includes(hotel.name.toLowerCase()));
}
