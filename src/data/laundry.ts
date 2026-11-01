import type { TripEvent } from './types';
import type { HotelId } from './hotels';

/**
 * Laundry, about once a week, added after the original plan (13.10.2026). Kept out of `trip-days.json` so the
 * source audit still holds; `trip.ts` merges these into their days.
 *
 * Evidence, checked 13.10.2026:
 * - CANDEO Kobe and CANDEO Osaka Namba: each hotel's FAQ says it has a coin laundry; no details.
 * - Oriental Hotel Tokyo Bay: laundry room beside the front desk, renewed in 2024, fully cashless
 *   (card or QR), wash+ machines with no detergent (Electrolux Professional case study).
 * - MYSTAYS Omori: a Jalan guest review says there is no coin laundry, so none is planned there.
 * Mornings are the quiet time in hotel laundries; evenings 19:00–23:00 are the busy ones.
 * Drying is the slow part: hotel all-in-one washer-dryers often need 2–3 hours and can leave
 * clothes damp; separate coin dryers take 60–90 minutes a load (¥100 per 10–30 min). Public
 * laundromats with gas dryers (ガス乾燥機) take 30–40 minutes. The windows below allow for that.
 */

const event = (fields: Omit<TripEvent, 'source' | 'special' | 'priority'>): TripEvent => ({
  ...fields,
  source: 'plan',
  special: null,
  priority: false,
});

export const laundryEvents: TripEvent[] = [
  event({
    id: 'laundry-kobe',
    title: '🧺 כביסה 1/2 — חדר הכביסה של CANDEO Kobe',
    time: '07:00',
    end: '10:30',
    date: '2037-11-08',
    city: 'קובה',
    status: 'planned',
    kind: 'activity',
    place: 'CANDEO HOTELS Kobe Tor Road',
    note: 'כביסה שבועית ראשונה: הבגדים של 2–7.11, כולל בגדי שבת. בבוקר חדרי הכביסה במלונות שקטים; בערב (19:00–23:00) יש תורים. לפי ה־FAQ של המלון יש כביסה במטבעות (コインランドリー) — מיקום, מחיר ושעות לשאול בדלפק בצ׳ק־אין ב־5.11. להביא מטבעות 100 ין ולסיים לפני הצ׳ק־אאוט ב־11:00. הייבוש הוא החלק האיטי: במכונה משולבת (洗濯乾燥機) כביסה וייבוש לוקחים 2–3 שעות, ובמייבש נפרד כשעה–שעה וחצי, ולכן מתחילות ב־07:00. לשאול בצ׳ק־אין אם המכונות משולבות או שיש מייבש נפרד. טיפים: לא למלא יותר מ־70% מהתוף (בכביסה+ייבוש — חצי), סחיטה נוספת (脱水) לפני הייבוש, ולהוציא כותנה כבדה (ג׳ינס, קפוצ׳ונים, מגבות) לתלייה בחדר.',
  }),
  event({
    id: 'laundry-osaka-backup',
    title: '🧺 כביסת גיבוי קטנה — רק אם חסרים בגדים',
    time: '07:00',
    end: '10:00',
    date: '2037-11-11',
    city: 'אוסקה',
    status: 'todo',
    kind: 'activity',
    place: 'CANDEO HOTELS Osaka Namba',
    note: 'לא חובה. הכביסה הבאה ב־15.11 במלון של דיסני, ובמלון באומורי (11–15.11) אין חדר כביסה לפי ביקורת אורחים. אם חסרים בגדים — מכונה אחת של בגדים קלים בבוקר, עם מספיק זמן לייבוש לפני הצ׳ק־אאוט ב־11:00. מה שלא התייבש — לתלות בחדר באומורי. לפי ה־FAQ של המלון יש כביסה במטבעות.',
  }),
  event({
    id: 'laundry-oriental',
    title: '🧺 כביסה 2/2 — חדר הכביסה ליד הדלפק, Oriental Hotel',
    time: '18:45',
    end: '21:00',
    date: '2037-11-15',
    city: 'מפרץ טוקיו',
    status: 'planned',
    kind: 'activity',
    place: 'Oriental Hotel Tokyo Bay, 1-8-2 Mihama, Urayasu, Chiba',
    note: 'כביסה שבועית שנייה: הבגדים של 8–15.11, כך שיש בגדים נקיים לדיסני ולטיסה הביתה. חדר הכביסה ליד הדלפק שופץ ב־2024, והתשלום בו ללא מזומן — אשראי או QR במסך מגע. המכונות מוסיפות לבד מים אלקליים לניקוי, אין צורך באבקה. מחירים ושעות לא פורסמו — לשאול בצ׳ק־אין. אפשר לראות בטלפון כמה זמן נשאר לכביסה ולייבוש. ללכת ישר מהצ׳ק־אין לחדר הכביסה ולהעדיף מייבש נפרד. מה שלא התייבש עד 21:00 — לתלות בחדר; יש שלושה לילות במלון, אז הוא יתייבש עד הטיסה. לא להישאר ערות מאוחר, כי השאטל לדיסני יוצא מוקדם.',
  }),
];

/** Day tags for the laundry days, shown after the original tags. */
export const laundryTags: Record<string, string> = {
  '2037-11-08': '🧺 כביסה 1/2',
  '2037-11-15': '🧺 כביסה 2/2',
};

export type LaundryPlan = 'planned' | 'backup' | 'optional' | 'none';

/** One stay's laundry: what the hotel has and whether a wash is planned there. Shown in Discover. */
export interface HotelLaundry {
  hotelId: HotelId;
  plan: LaundryPlan;
  where: string;
  pay: string;
  tip: string;
  /** Matching itinerary event, if a wash is on the timeline. */
  eventId?: string;
  /** Maps destination for a public coin laundry when the hotel has none. */
  fallbackQuery?: string;
}

/** In stay order. Facts as checked on 13.10.2026 (see the evidence note at the top). */
export const hotelLaundry: HotelLaundry[] = [
  {
    hotelId: 'shinagawa',
    plan: 'optional',
    where: 'Main Tower קומה 9 — 7 מכונות תוף ו־7 עליונות, כביסה וייבוש',
    pay: 'מטבעות',
    tip: 'לא מתוכנן, רק אם צריך — הכביסה הראשונה ב־8.11 בקובה.',
  },
  {
    hotelId: 'kobe',
    plan: 'planned',
    where: 'כביסה במטבעות במלון (コインランドリー) — מיקום לשאול בצ׳ק־אין',
    pay: 'מטבעות 100 ין · לבדוק אם יש אשראי',
    tip: 'מתחילות ב־07:00 כי הייבוש לוקח שעה עד שלוש. לשאול בצ׳ק־אין אם יש מייבש נפרד. לסיים לפני הצ׳ק־אאוט ב־11:00.',
    eventId: 'laundry-kobe',
  },
  {
    hotelId: 'osakaNamba',
    plan: 'backup',
    where: 'כביסה במטבעות במלון, לפי ה־FAQ',
    pay: 'מטבעות',
    tip: 'רק אם חסרים בגדים — מכונה אחת של בגדים קלים בבוקר, כי באומורי אין חדר כביסה.',
    eventId: 'laundry-osaka-backup',
  },
  {
    hotelId: 'omori',
    plan: 'none',
    where: 'אין חדר כביסה במלון, לפי ביקורת אורחים',
    pay: '—',
    tip: 'בחירום: מכבסה ציבורית ליד תחנת Omori (לחפש ״コインランドリー״).',
    fallbackQuery: 'コインランドリー 大森駅',
  },
  {
    hotelId: 'orientalTokyoBay',
    plan: 'planned',
    where: 'ליד הדלפק, שופץ ב־2024 — המכונות מוסיפות חומר ניקוי לבד',
    pay: 'ללא מזומן — אשראי או QR',
    tip: 'ישר אחרי הצ׳ק־אין. מכונות מקצועיות, כנראה מהירות יותר; מה שלא התייבש — לתלות בחדר.',
    eventId: 'laundry-oriental',
  },
];

/** What to pack for laundry; mirrors the `laundry_kit` checklist task. */
export const laundryKit = [
  'שקית כביסה מתקפלת',
  'שקית רשת לבגדים עדינים',
  'אטבים, קולבים וחבל קטן לייבוש בחדר',
  '¥2,000 במטבעות 100 ין לקובה — המייבש עלול לדרוש כמה סבבים',
  'בגדים מבד שמתייבש מהר — כותנה כבדה מתייבשת לאט',
];
