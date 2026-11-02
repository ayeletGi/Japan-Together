import type { TripEvent } from './types';

/**
 * Luggage forwarding (takkyubin, 宅急便) on the hotel-change days, added after the original plan (15.10.2026).
 * Decided 15.10.2026: we always send the suitcases ahead, except Kobe → Osaka (see below).
 * Kept out of `trip-days.json` so the source audit still holds; `trip.ts` merges these into their days.
 *
 * Evidence, checked 15.10.2026:
 * - No booking ahead: the hotel front desk fills in a Yamato waybill and takes payment (often cash).
 * - Hotel to hotel is next-day between Tokyo and Kansai (sometimes two days), so a suitcase goes
 *   one day before the move, in the morning. Ask each desk for its pickup cutoff.
 * - Price for one ordinary check-in suitcase (160 size): about ¥2,500–3,600 Tokyo↔Osaka/Kobe,
 *   less within Kanto. Guides disagree; the desk quotes the real price.
 * - Tokaido Shinkansen: a bag whose three sides add up to over 160 cm needs a seat with an
 *   oversized-baggage area booked ahead, or there is a ¥1,000 fee on board. Sending it avoids that.
 * - Yamato's own FAQ asks for the bag to reach the next hotel at least one day before the stay, and only
 *   from a front desk that works with Yamato. Here it arrives on the check-in day itself, which usually
 *   works for an evening arrival but is not promised.
 * - Arrival: SAGAWA counters in the Narita T1/T2 arrival halls (since 22.7.2026) deliver to hotels in ten
 *   Tokyo wards, Minato included (Shinagawa Prince), the same day. Walk-up, drop by 14:00; with the ¥660
 *   airport charge ¥1,570 up to 60 cm, ¥2,180 up to 100 cm, ¥2,840 up to 140 cm (larger: Sagawa's list).
 * - Kobe → Osaka: by default the suitcases come with us on the Hanshin line (straight to Osaka-Namba in
 *   ~40 minutes); next-day forwarding handed in on motzash or 8.11 would only reach Osaka on 9.11 (the
 *   kimono morning). Correction 2.11.2026 (checked by us on Yamato's official site): Yamato has same-day
 *   delivery from Kobe to parts of Osaka, and Naniwa ward (Namba) is in the service area. It depends on
 *   the drop-off point, the hand-in time and the bag, and there is no promised arrival time. CANDEO
 *   Osaka Namba asks to be told ahead when luggage is sent before arrival. So it is an option only once
 *   both hotels confirm; until then, plan on the train.
 */

const event = (
  fields: Omit<TripEvent, 'source' | 'special' | 'priority' | 'status' | 'kind'> & {
    kind?: string;
  },
): TripEvent => ({
  kind: 'hotel',
  ...fields,
  source: 'plan',
  special: null,
  priority: false,
  status: 'planned',
});

const HOW =
  'אין צורך להזמין מראש: אומרים בדלפק ״takkyubin״ (宅急便), ממלאים טופס עם כתובת המלון הבא, שם ותאריך ההגעה, ומשלמות במקום (לרוב מזומן). לוודא שהדלפק עובד עם Yamato ולשאול עד איזו שעה הם אוספים היום.';

export const luggageEvents: TripEvent[] = [
  event({
    id: 'luggage-narita-sameday',
    kind: 'transport',
    title: '🧳 לשלוח את המזוודות מנריטה למלון (SAGAWA, באותו יום)',
    time: '14:00',
    end: null,
    date: '2037-11-03',
    city: 'טוקיו',
    place: 'Narita International Airport Terminal 1',
    note: 'באולם ההגעה של טרמינל 1 יש דלפק SAGAWA (佐川急便) שמוביל מזוודות באותו יום למלונות ב־Minato, ובו Shinagawa Prince. לא מזמינים מראש: ניגשות לדלפק, נותנות את שם המלון ומשלמות. צריך להגיע לדלפק עד 14:00 — עם נחיתה ב־13:25 זה צפוף, אז ללכת לדלפק מיד אחרי המכס. מחיר לפי סכום שלוש הצלעות, כולל ¥660 עמלת שדה: עד 140 ס״מ ¥2,840; מזוודה גדולה יותר — לשאול בדלפק. המזוודות מחכות בקבלה של המלון, ואתן אוכלות ב־T’s Tantan בלי לגרור אותן. אם פספסתן את 14:00 — לוקחות אותן איתכן לארוחה (יש לוקרים ושמירת חפצים בתחנת Tokyo) ולמלון.',
  }),
  event({
    id: 'luggage-to-kobe',
    title: '🧳 לשלוח את המזוודות לקובה (Yamato)',
    time: '08:30',
    end: null,
    date: '2037-11-04',
    city: 'טוקיו',
    place: 'Shinagawa Prince Hotel, Tokyo',
    note: `לפני שיוצאות לטיול של היום, להשאיר בדלפק את המזוודות הגדולות לשליחה אל CANDEO Kobe Tor Road. הן מגיעות למחרת, 5.11, ומחכות בקבלה כשתגיעו ב־20:30. ${HOW} כ־¥2,500–3,600 למזוודה רגילה. להשאיר תיק קטן עם בגדים ל־4.11 ול־5.11. כך ב־5.11 נוסעות מ־Nakano ישר לתחנת Shinagawa, ובשינקנסן אין בעיית מזוודה גדולה (מעל 160 ס״מ סכום הצלעות צריך מושב עם מקום למטען שהוזמן מראש, אחרת קנס ¥1,000). Yamato ממליצים שהמזוודה תגיע יום לפני הלינה; כאן היא מגיעה ביום עצמו — בדרך כלל עד הערב, אבל בלי התחייבות, אז מה שחייבים ללילה נשאר בתיק הקטן.`,
  }),
  event({
    id: 'luggage-kobe-osaka',
    title: '🧳 מזוודות לאוסקה: ברכבת, או Yamato באותו יום אם שני המלונות אישרו',
    time: '12:05',
    end: null,
    date: '2037-11-08',
    city: 'אוסקה',
    place: 'CANDEO HOTELS Osaka Namba',
    note: 'ברירת המחדל: לוקחות את המזוודות ב־Hanshin ישר ל־Osaka-Namba (כ־40 דקות), משאירות בדלפק לפני ארוחת הצהריים, ונכנסות לחדר ב־15:00. אופציה: ל־Yamato יש משלוח באותו יום מקובה לחלקים מאוסקה, ו־Namba (רובע Naniwa) באזור השירות — אבל זה תלוי בנקודת המסירה, בשעת הקבלה ובמזוודה, ואין התחייבות לשעת הגעה. משלוח רגיל (למחרת) יגיע רק ב־9.11, בוקר הקימונו. לבנות על זה רק אחרי אישור משני המלונות: CANDEO Kobe מאשר שאפשר למסור ב־8.11 בבוקר ושהמזוודות יגיעו באותו יום, ו־CANDEO Osaka Namba מבקש שיודיעו לו מראש. בלי שני האישורים — ברכבת. אם שולחות: תיק קטן עם מה שצריך עד הערב.',
  }),
  event({
    id: 'luggage-to-omori',
    title: '🧳 לשלוח את המזוודות לאומורי (Yamato)',
    time: '07:30',
    end: null,
    date: '2037-11-10',
    city: 'אוסקה',
    place: 'CANDEO HOTELS Osaka Namba',
    note: `לארוז ערב קודם, ולפני היציאה ל־USJ להשאיר בדלפק את המזוודות הגדולות לשליחה אל HOTEL MYSTAYS PREMIER Omori. הן מגיעות ב־11.11 ומחכות שם כשתגיעו בלילה. לשלוח בבוקר ולא בערב — משלוח מהערב יוצא רק למחרת ועלול להגיע רק ב־12.11. ${HOW} כ־¥2,500–3,600 למזוודה רגילה. להשאיר תיק קטן ללילה ול־11.11. כך ב־11.11 עושות שופינג וגם Umeda בלי לגרור מזוודות, ובשינקנסן NOZOMI 46 אין בעיית מזוודה גדולה. Yamato ממליצים שהמזוודה תגיע יום לפני הלינה; כאן היא מגיעה ביום עצמו — בדרך כלל עד הערב, אבל בלי התחייבות, אז מה שחייבים ללילה נשאר בתיק הקטן.`,
  }),
  event({
    id: 'luggage-to-oriental',
    title: '🧳 לשלוח את המזוודות למלון בדיסני (Yamato)',
    time: '10:30',
    end: null,
    date: '2037-11-15',
    city: 'טוקיו',
    place: 'HOTEL MYSTAYS PREMIER Omori Tokyo',
    note: `בצ׳ק־אאוט, לשלוח את המזוודות הגדולות אל Oriental Hotel Tokyo Bay. הן מגיעות למחרת, 16.11 — אחרי יום הפארק הן כבר במלון. ${HOW} בתוך אזור טוקיו זה זול יותר, בערך ¥2,000–3,200 למזוודה. צריך תיק עם בגדים ללילה ולדיסנילנד, וגם הכביסה של הערב. כך לא חוזרות לאומורי — מהקניות בשיבויה נוסעות ישר לתחנת Tokyo ולמלון.`,
  }),
];
