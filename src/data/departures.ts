/**
 * Departure advice for the Today screen and the departures page: checked plans for the confirmed
 * attractions, and the prototype's estimates for a few other stops.
 */
import type { HotelId } from './hotels';
import type { ExternalResource } from './types';

export interface InternalEvent {
  id: string;
  label: string;
  time: string | null;
  end: string | null;
}

/**
 * A recommended departure for a confirmed attraction. Leave/arrive times are planning advice,
 * kept separate from the booked times in the source data.
 */
export interface DeparturePlan {
  eventId: string;
  date: string;
  title: string;
  hotel: HotelId;
  /** Where the day starts: walking out of the hotel, or waiting at the hotel's own shuttle stop. */
  startsFrom: 'hotel' | 'shuttle';
  destination: string;
  leave: string;
  arriveBy: string;
  booking: string;
  route: string;
  reason: string;
  evidence: string;
  note?: string;
  /** The visitors will probably already be nearby: show the note up front and a current-location route. */
  likelyNearby?: { routeLabel: string };
  source?: ExternalResource;
  parkCalendar?: ExternalResource;
  /** Timed entries inside the venue that share this single departure. */
  internalEvents?: InternalEvent[];
  internalAdvice?: string;
}

export const checkedOn = '2037-10-13';

const shuttleTimetable: ExternalResource = {
  label: 'לוח ההסעות הרשמי של המלון',
  url: 'https://www.oriental-hotel.co.jp/access/timeshuttle/',
};

const disneyPark = (park: 'tdl' | 'tds'): ExternalResource => ({
  label: 'לוח הפתיחה הרשמי של הפארק',
  url: `https://www.tokyodisneyresort.jp/en/${park}/monthly/calendar/202611/`,
});

/** Both Disney days start the same way: the hotel's own shuttle to the park gate. */
const disneyShuttle = {
  hotel: 'orientalTokyoBay',
  startsFrom: 'shuttle',
  leave: '07:00',
  arriveBy: '08:00',
  booking: 'כרטיס לפארק מאושר · פתיחה רשמית: 09:00',
  route:
    'יורדות לתחנת ההסעה של המלון בקומה 1. אני ממליצה על שאטל המלון ישירות לפארק, בלי החלפת רכבות.',
  reason:
    'להיות בתחנת ההסעה ב־07:00 ולכוון לשאטל של 07:10. לפי המלון הנסיעה אורכת כ־15–30 דקות; נשאר מרווח גם אם צריך להמתין להסעה הבאה, וזמן לתור לפני הפתיחה.',
  evidence:
    'מקור ההמלצה הוא המלון: בלוח שנבדק ההסעות יוצאות כל 10 דקות בין 07:00 ל־09:50. השאטל אינו רכבת שנבדקה ב־Google Maps. ללא הזמנת מקום, לפי מקום פנוי; יש לאשר בקבלה את לוח יום הביקור.',
  source: shuttleTimetable,
} satisfies Partial<DeparturePlan>;

export const departurePlans: DeparturePlan[] = [
  {
    eventId: 'd4-01',
    date: '2037-11-04',
    title: 'teamLab Planets',
    hotel: 'shinagawa',
    startsFrom: 'hotel',
    destination: 'teamLab Planets TOKYO Toyosu',
    leave: '08:45',
    arriveBy: '09:45',
    booking: 'חלון כניסה מאושר: 10:00–10:30',
    route:
      'הליכה ל־Shinagawa → קו JR Tōkaidō ל־Shimbashi → קו Yurikamome ל־Shin-Toyosu → הליכה לכניסה.',
    reason:
      'מקדימות ב־13 דקות את היציאה שמצאתי במפות, ומשאירות רבע שעה לפני חלון הכניסה. אני ממליצה על הרכבות: teamLab מזהירים מעומס באוטובוסים לאזור.',
    evidence:
      'Google Maps ל־4.11, הגעה עד 09:45: מסלול 08:58–09:45, 47 דקות בסך הכול, כולל 11 דקות הליכה.',
    source: {
      label: 'הנחיות ההגעה של teamLab',
      url: 'https://teamlabplanets.dmm.com/en/guide/access_method',
    },
  },
  {
    eventId: 'd9-03',
    date: '2037-11-09',
    title: 'MOMO · קימונו בגיון',
    hotel: 'osakaNamba',
    startsFrom: 'hotel',
    destination: 'KIMONO RENTAL MOMO Gion Yamatocho 12 Kyoto',
    leave: '07:55',
    arriveBy: '10:15',
    booking: 'הזמנה מאושרת: 10:30',
    route:
      'הליכה ל־Nagahoribashi → קו Sakaisuji והמשך בקו Hankyu-Kyoto לכיוון Kyoto-Kawaramachi → הליכה לסניף Gion, ב־Yamatocho 12.',
    reason:
      'שומרת על היציאה המוקדמת מהתכנון שלכן כדי להשאיר זמן לאוכל ולהתמצאות. החלופה שמצאתי במפות עוברת ב־Hankyu; בוחרות רכבת והחלפה לפי ההנחיות המעודכנות באותו בוקר.',
    evidence:
      'Google Maps ל־9.11, הגעה עד 10:15: מסלול 09:05–10:11, 66 דקות כולל 13 דקות הליכה. 07:55 היא המלצה מרווחת מהתכנון המקורי, ולא שעת הרכבת הזו.',
    note: 'המסלול המקורי דרך Yodoyabashi ו־Keihan נשמר בתכנון. זו חלופה מומלצת נוספת; בהשוואה שנבדקה הופיעה התראה בחלופות Keihan. יש להגיע לסניף Gion, לא לסניף אחר.',
  },
  {
    eventId: 'd10-01',
    date: '2037-11-10',
    title: 'Universal Studios Japan',
    hotel: 'osakaNamba',
    startsFrom: 'hotel',
    destination: 'Universal Studios Japan Osaka',
    leave: '07:10',
    arriveBy: '08:00',
    booking: 'כרטיס לפארק מאושר · ללא שעת כניסה במקור',
    route:
      'הליכה ל־Kintetsu-Nippombashi → רכבת בהמשך לקו Hanshin Namba עד Nishikujo → קו JR Yumesaki ל־Universal City → הליכה לשער.',
    reason:
      'מקדימות ב־15 דקות את המסלול שנמצא, עם החלפה אחת ב־Nishikujo. יעד ההגעה ב־08:00 נועד להשאיר זמן לתור ולבידוק; זו המלצת תכנון.',
    evidence:
      'Google Maps ל־10.11, הגעה עד 08:00: מסלול 07:25–07:57, 32 דקות כולל 12 דקות הליכה, Kintetsu-Nara + JR Yumesaki.',
    note: 'שעת פתיחת הפארק ל־10.11 לא אומתה כאן. בדקו בלוח הרשמי ערב קודם והתאימו את היציאה אם צריך. לכל המתקנים יוצאות מהמלון פעם אחת בלבד.',
    source: {
      label: 'שעות הפתיחה באתר USJ',
      url: 'https://www.usj.co.jp/web/ja/jp/park-guide/schedule/park-hour/',
    },
    internalEvents: [
      { id: 'd10-02', label: 'Harry Potter and the Forbidden Journey', time: null, end: null },
      { id: 'd10-03', label: 'The Flying Dinosaur', time: null, end: null },
      { id: 'd10-04', label: 'SUPER NINTENDO WORLD', time: '15:30', end: '16:30' },
      { id: 'd10-05', label: 'Mario Kart', time: '15:30', end: '16:00' },
      { id: 'd10-06', label: 'Mine Cart', time: '16:00', end: '16:30' },
      { id: 'd10-07', label: 'Minion Blast', time: '18:00', end: '18:30' },
    ],
    internalAdvice:
      'כבר בתוך הפארק — אין יציאה נוספת מהמלון. המלצה: להתקרב לאזור נינטנדו עד 15:10 ולמיניונים עד 17:40; לא להיכנס לתור ארוך לפני החלונות.',
  },
  {
    eventId: 'd12-04',
    date: '2037-11-12',
    title: 'The Head Spa Tokyo · ANNEX',
    hotel: 'omori',
    startsFrom: 'hotel',
    destination: 'The Head Spa Tokyo Annex 3-6-19 Shibuya Tokyo',
    leave: '17:45',
    arriveBy: '18:45',
    booking: 'טיפול מאושר: 19:00–20:50',
    route:
      'הליכה ל־Ōmori → קו Keihin-Tōhoku ל־Shinagawa → קו Yamanote ל־Shibuya → הליכה לסניף ANNEX, ‏3-6-19, קומה B1.',
    reason:
      'אם יוצאות מהמלון: מקדימות ב־14 דקות את המסלול במפות, ומכוונות להגיע רבע שעה לפני הטיפול כדי למצוא בנחת את הכניסה.',
    evidence: 'Google Maps ל־12.11, הגעה עד 18:45: מסלול 17:59–18:44, 45 דקות כולל 22 דקות הליכה.',
    note: 'לפי התכנון כבר תהיו בקניות בשיבויה. אין צורך לחזור למלון בשביל המסלול: פתחו מפות מהמקום שבו אתן נמצאות וכוונו להגעה ב־18:45. שעת 17:45 מתייחסת רק ליציאה מהמלון.',
    likelyNearby: { routeLabel: 'כבר בשיבויה? מסלול מהמיקום שלכן' },
    source: {
      label: 'כתובת סניף ANNEX באתר הספא',
      url: 'https://www.headspatokyo.com/salon/the-headspa-tokyo-shibuya-annex',
    },
  },
  {
    eventId: 'd16-01',
    date: '2037-11-16',
    title: 'Tokyo Disneyland',
    ...disneyShuttle,
    destination: 'Tokyo Disneyland',
    note: 'חלופה שנבדקה במפות: קו Keiyō מ־Shin-Urayasu ל־Maihama והליכה. שעת פתיחה 09:00 אומתה בלוח Disneyland ל־16.11.',
    parkCalendar: disneyPark('tdl'),
  },
  {
    eventId: 'd17-01',
    date: '2037-11-17',
    title: 'Tokyo DisneySea',
    ...disneyShuttle,
    destination: 'Tokyo DisneySea',
    note: 'חלופת תחבורה ציבורית במפות: רכבת מ־Shin-Urayasu ל־Maihama והמשך לפי המסלול המעודכן לפארק. שעת פתיחה 09:00 אומתה בלוח DisneySea ל־17.11.',
    parkCalendar: disneyPark('tds'),
  },
];

/**
 * When to leave for a stop, as the Today screen and the stop sheet show it ("צאו ב־08:45").
 * Checked plans are `departurePlans`; the rest are estimates, marked `estimate` until confirmed.
 */
export interface LeaveInfo {
  eventId: string;
  leave: string;
  arriveBy: string;
  /** Where the walk starts: the hotel door, the hotel's shuttle stop, inside a park, or the stop before. */
  from: 'hotel' | 'shuttle' | 'park' | 'stop';
  steps: string[];
  /** The booking this departure serves ("חלון כניסה מאושר: 10:00–10:30"). */
  booking?: string;
  why?: string;
  tip?: string;
  /** An estimate from the design prototype, not yet confirmed by the travellers. */
  estimate: boolean;
  mapsUrl?: string;
}

/**
 * Leave times the prototype estimated for stops without a checked plan (13–14.10.2026). They show
 * with "(הערכה)" until the travellers confirm them; then set `estimate: false`.
 */
export const estimatedLeaves: LeaveInfo[] = [
  {
    eventId: 'd5-02',
    leave: '11:15',
    arriveBy: '11:55',
    from: 'hotel',
    steps: [
      'הליכה לתחנת Shinagawa',
      'JR Yamanote עד Shinjuku',
      'JR Chuo עד Nakano',
      'הליכה מקורה עד Broadway',
    ],
    booking: 'החנויות נפתחות ב־12:00',
    tip: 'המזוודות נשלחו לקובה ב־4.11, אז יוצאות רק עם תיק קטן',
    estimate: true,
  },
  {
    eventId: 'd5-03',
    leave: '16:10',
    arriveBy: '17:05',
    from: 'stop',
    steps: [
      'מ־Nakano ב־JR Chuo עד Shinjuku',
      'JR Yamanote עד Shinagawa',
      'שערי השינקנסן, הרציף, קרון 14',
    ],
    booking: 'רכבת 17:19 · קרון 14 · מושבים 10D/10E',
    tip: 'הרכבת לא מחכה, להיות על הרציף 10 דק׳ לפני',
    estimate: true,
  },
  {
    eventId: 'd6-01',
    leave: '09:35',
    arriveBy: '09:55',
    from: 'hotel',
    steps: ['הליכה לתחנת Shin-Kobe', 'תחנת הרכבל ליד הכניסה למלון ANA Crowne Plaza'],
    booking: 'הרכבל נפתח ב־09:30',
    estimate: true,
  },
  {
    eventId: 'd8-02',
    leave: '11:00',
    arriveBy: '12:00',
    from: 'hotel',
    steps: [
      'צ׳ק־אאוט עם המזוודות',
      'Hanshin מ־Kobe-Sannomiya עד Osaka-Namba',
      'להשאיר מזוודות במלון לפני הצ׳ק־אין',
    ],
    booking: 'צ׳ק־אאוט מ־CANDEO Kobe',
    tip: 'הקו Hanshin נוסע ישר, בלי החלפות',
    estimate: true,
  },
  {
    eventId: 'd10-04',
    leave: '15:10',
    arriveBy: '15:25',
    from: 'park',
    steps: ['ללכת לאזור Jurassic Park', 'הכניסה דרך צינור המריו'],
    booking: 'כניסה בשעה 15:30 · לא נכנסים אחרי החלון',
    tip: 'לפתוח את הכרטיס באפליקציה של USJ לפני',
    estimate: true,
  },
];
