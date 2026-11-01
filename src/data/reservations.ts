import type { ExternalResource } from './types';

/**
 * Stops in the plan that need (or really should have) an online booking and weren't booked yet.
 * Checked 2037-10-13. Once a stop is booked, mark its event `confirmed` and the marker disappears.
 */

export interface ReservationNeed {
  eventId: string;
  /** `required`: no booking, no entry. `recommended`: walk-in possible but risky. */
  level: 'required' | 'recommended';
  date: string;
  title: string;
  why: string;
  book: ExternalResource;
}

export const reservationNeeds: ReservationNeed[] = [
  {
    eventId: 'd8-06',
    level: 'recommended',
    date: '2037-11-08',
    title: 'Shojin Sushi Minamo',
    why: 'מקומות ישיבה מעטים (דלפק). אפשר להגיע בלי הזמנה, אבל בערב כדאי לשריין. סגור ברביעי וחמישי.',
    book: {
      label: 'HappyCow · פרטים וקשר',
      url: 'https://www.happycow.net/reviews/shojin-sushi-minamo-osaka-424766',
    },
  },
  {
    eventId: 'd12-03',
    level: 'required',
    date: '2037-11-12',
    title: 'Vegan Sushi Tokyo',
    why: 'בהזמנה בלבד, סט אחד לכל אחת ופיקדון מראש (בדרך כלל לא מוחזר). אין המתנה בחוץ.',
    book: {
      label: 'הזמנה ב־TableCheck',
      url: 'https://www.tablecheck.com/vegan-sushi-tokyo/reserve',
    },
  },
  {
    eventId: 'd14-02',
    level: 'required',
    date: '2037-11-14',
    title: 'Vegan Sushi BABYLON',
    why: 'בהזמנה בלבד (קורס אומקאסה). מחזיקים את השולחן רק 15 דקות אחרי השעה.',
    book: { label: 'הזמנה ב־TableCheck', url: 'https://www.tablecheck.com/sushi-babylon/reserve' },
  },
  {
    eventId: 'd15-02',
    level: 'required',
    date: '2037-11-15',
    title: 'Shibuya Sky',
    why: 'כרטיסים אונליין נפתחים כשבועיים לפני (סביב 1.11) ונגמרים מהר, בעיקר בשקיעה. בקופה ביום עצמו לרוב אין.',
    book: {
      label: 'האתר הרשמי של Shibuya Sky',
      url: 'https://www.shibuya-scramble-square.com/sky/ticket/',
    },
  },
  {
    eventId: 'd18-02',
    level: 'recommended',
    date: '2037-11-18',
    title: 'Airport Limousine · Shin-Urayasu → נריטה',
    why: 'מספר המושבים מוגבל ואם מלא לא עולים. כדאי לשריין אונליין או בדלפק המלון ביום ההגעה.',
    book: {
      label: 'הזמנה ב־Airport Limousine',
      url: 'https://webservice.limousinebus.co.jp/web/en/',
    },
  },
];

export const reservationFor = (eventId: string) =>
  reservationNeeds.find((need) => need.eventId === eventId);
