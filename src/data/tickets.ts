import type { ExternalResource } from './types';

/**
 * Public ticket metadata only: what was booked, when, and how to open the real ticket in the
 * official app or site. QR codes, PDFs, booking numbers and receipts are never part of this build;
 * they live in the private folder (see Settings).
 */

export type TicketCategory =
  'flights' | 'trains' | 'parks' | 'teamlab' | 'hotels' | 'restaurants' | 'chabad' | 'treatments';

export interface TicketEntry {
  id: string;
  category: TicketCategory;
  title: string;
  /** Itinerary date and the event it belongs to. */
  date: string;
  eventIds: string[];
  when: string;
  quantity: string;
  /** What to have ready at the door. */
  bring: string;
  howToOpen?: ExternalResource;
}

const official = {
  elal: { label: 'אתר / אפליקציית EL AL', url: 'https://www.elal.com/' },
  smartEx: { label: 'Reservation Details ב־SmartEX', url: 'https://smart-ex.jp/en/' },
  limousine: {
    label: 'ניהול ההזמנה ב־Airport Limousine',
    url: 'https://webservice.limousinebus.co.jp/web/en/Top.aspx',
  },
  usj: { label: 'האתר הרשמי של USJ', url: 'https://www.usj.co.jp/web/en/us' },
  disney: { label: 'אפליקציית Tokyo Disney Resort', url: 'https://www.tokyodisneyresort.jp/en/' },
  teamLab: { label: 'האתר של teamLab Planets', url: 'https://teamlabplanets.dmm.com/en' },
  uzu: { label: 'האתר של UZU Kyoto', url: 'https://vegan-uzu.com/pages/uzu-kyoto-en' },
  headSpa: {
    label: 'סניף ANNEX באתר הספא',
    url: 'https://www.headspatokyo.com/salon/the-headspa-tokyo-shibuya-annex',
  },
} satisfies Record<string, ExternalResource>;

export const tickets: TicketEntry[] = [
  {
    id: 'ly91',
    category: 'flights',
    title: 'LY91 · תל אביב → נריטה',
    date: '2037-11-02',
    eventIds: ['d2-01', 'd3-01'],
    when: 'המראה 2.11 ב־19:00 (ישראל) · נחיתה 3.11 ב־13:25 (יפן)',
    quantity: 'צילום אישור לנוסעת אחת — לוודא מסמך לכל אחת',
    bring: 'דרכון וכרטיס עלייה מהאפליקציה או מהדלפק',
    howToOpen: official.elal,
  },
  {
    id: 'ly92',
    category: 'flights',
    title: 'LY92 · נריטה → תל אביב',
    date: '2037-11-18',
    eventIds: ['d18-03'],
    when: 'המראה 18.11 ב־15:45 (יפן) · נחיתה באותו יום ב־22:05 (ישראל)',
    quantity: 'צילום אישור לנוסעת אחת — לוודא מסמך לכל אחת',
    bring: 'דרכון; להגיע לנריטה T1 סביב 12:30 או מוקדם יותר',
    howToOpen: official.elal,
  },
  {
    id: 'nozomi-53',
    category: 'trains',
    title: 'NOZOMI 53 · Shinagawa → Shin-Kobe',
    date: '2037-11-05',
    eventIds: ['d5-03'],
    when: '5.11 · 17:19–19:53',
    quantity: 'אושר לשתיכן · קרון 14, 10D/10E',
    bring:
      'QR-Ticket מתוך SmartEX (Reservation Details → Display QR-Ticket) או כרטיס IC משויך. מייל האישור אינו כרטיס.',
    howToOpen: official.smartEx,
  },
  {
    id: 'nozomi-46',
    category: 'trains',
    title: 'NOZOMI 46 · Shin-Osaka → Shinagawa',
    date: '2037-11-11',
    eventIds: ['d11-04'],
    when: '11.11 · 18:30–20:49',
    quantity: 'אושר לשתיכן · קרון 14, 8D/8E',
    bring: 'QR-Ticket מ־SmartEX או כרטיס IC משויך לכל אחת. מייל האישור אינו כרטיס.',
    howToOpen: official.smartEx,
  },
  {
    id: 'limousine',
    category: 'trains',
    title: 'Airport Limousine · Shin-Urayasu → נריטה T1',
    date: '2037-11-18',
    eventIds: ['d18-02'],
    when: '18.11 · יציאה 11:03 · הגעה משוערת 12:05',
    quantity: 'אושר ושולם לשתיכן',
    bring:
      'קוד ה־QR מהמייל של limousinebus.co.jp (להראות לנהג). שינוי או ביטול עד 5 דקות לפני היציאה.',
    howToOpen: official.limousine,
  },
  {
    id: 'usj',
    category: 'parks',
    title: 'Universal Studios Japan · Studio Pass + Express',
    date: '2037-11-10',
    eventIds: ['d10-01', 'd10-02', 'd10-03', 'd10-04', 'd10-05', 'd10-06', 'd10-07'],
    when: '10.11 · Nintendo 15:30–16:30 · Mario Kart 15:30–16:00 · Mine Cart 16:00–16:30 · Minions 18:00–18:30',
    quantity: '2 Studio Pass + 2 Express Pass',
    bring:
      'להדפיס את שני כרטיסי ה־QR המלאים של הכניסה. כרטיסי ה־Express אינם תחליף לכניסה — לשמור את שניהם נגישים.',
    howToOpen: official.usj,
  },
  {
    id: 'disneyland',
    category: 'parks',
    title: 'Tokyo Disneyland',
    date: '2037-11-16',
    eventIds: ['d16-01'],
    when: '16.11 · יום פארק',
    quantity: '2 כרטיסים, QR נפרד לכל אחת',
    bring: 'הכרטיסים באפליקציה הרשמית; עותק מודפס לגיבוי',
    howToOpen: official.disney,
  },
  {
    id: 'disneysea',
    category: 'parks',
    title: 'Tokyo DisneySea',
    date: '2037-11-17',
    eventIds: ['d17-01'],
    when: '17.11 · יום פארק',
    quantity: '2 כרטיסים, QR נפרד לכל אחת',
    bring: 'הכרטיסים באפליקציה הרשמית; עותק מודפס לגיבוי',
    howToOpen: official.disney,
  },
  {
    id: 'teamlab',
    category: 'teamlab',
    title: 'teamLab Planets TOKYO',
    date: '2037-11-04',
    eventIds: ['d4-01'],
    when: '4.11 · חלון כניסה 10:00–10:30',
    quantity: '2 כרטיסים',
    bring:
      'ה־QR נפתח רק מחצות (שעון יפן) ביום הביקור, דרך החשבון או המייל. לפני כן אין כרטיס להציג.',
    howToOpen: official.teamLab,
  },
  {
    id: 'hotels',
    category: 'hotels',
    title: 'חמשת המלונות',
    date: '2037-11-03',
    eventIds: ['d3-03', 'd5-04', 'd8-04', 'd11-05', 'd15-05'],
    when: '3–18.11 · פירוט מלא בעמוד המלונות',
    quantity: 'חדר לשתיכן בכל מלון',
    bring: 'דרכונים; אישור ההזמנה מהתיקייה הפרטית',
  },
  {
    id: 'uzu-kyoto',
    category: 'restaurants',
    title: 'UZU Kyoto',
    date: '2037-11-09',
    eventIds: ['d9-05'],
    when: '9.11 · 18:00 (לא 18:30) · עד 75 דקות',
    quantity: 'אושר לשתיכן · שולם מראש',
    bring: 'להגיע בזמן; ללא בושם או ניחוחות חזקים',
    howToOpen: official.uzu,
  },
  {
    id: 'kimono',
    category: 'treatments',
    title: 'Kimono Rental MOMO · Gion',
    date: '2037-11-09',
    eventIds: ['d9-03'],
    when: '9.11 · 10:30',
    quantity: 'אושר לשתיכן (באינסטגרם)',
    bring: 'להגיע לסניף MOMO Gion, Yamatocho 12, Watadi Building 1F — לא לסניף אחר',
  },
  {
    id: 'head-spa',
    category: 'treatments',
    title: 'Head Spa · Shibuya ANNEX',
    date: '2037-11-12',
    eventIds: ['d12-04'],
    when: '12.11 · 19:00–20:50 · 110 דקות',
    quantity: 'לשתיכן — כל אחת הזמינה בנפרד, באותו חדר ובאותה שעה',
    bring: 'תשלום בכרטיס בלבד; איחור של מעל 10 דקות עלול לקצר את הטיפול',
    howToOpen: official.headSpa,
  },
  {
    id: 'chabad-kobe',
    category: 'chabad',
    title: 'שבת בחב״ד קובה',
    date: '2037-11-06',
    eventIds: ['d6-04', 'd7-01'],
    when: '6–7.11 · ליל שבת וסעודות שבת',
    quantity: 'אושר לשתיכן',
    bring: 'לוודא מראש את שעת סעודת שישי — אינה מופיעה באישור',
  },
  {
    id: 'chabad-tokyo',
    category: 'chabad',
    title: 'שבת בחב״ד טוקיו',
    date: '2037-11-13',
    eventIds: ['d13-05', 'd14-01'],
    when: '13–14.11 · ליל שבת, תפילות וסעודות',
    quantity: 'אושר לשתיכן',
    bring: 'להשתמש בכתובת ובקישור שהתקבלו באישור; לוודא שעות מול חב״ד',
  },
];
