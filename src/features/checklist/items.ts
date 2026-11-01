import type { Bilingual } from '../../data/types';

/**
 * The "before the flight" checklist (brief 6.8). Texts follow the prototype; the user still has
 * to confirm the list. Ids are saved on the phone, so keep them stable when editing texts.
 */
export interface ChecklistItem {
  id: string;
  title: Bilingual;
  sub?: Bilingual;
}

export interface ChecklistGroup {
  id: string;
  title: Bilingual;
  items: ChecklistItem[];
}

export const checklistGroups: ChecklistGroup[] = [
  {
    id: 'now',
    title: { he: 'כבר עכשיו', en: 'Right now' },
    items: [
      {
        id: 'vjw',
        title: { he: 'Visit Japan Web לשתינו', en: 'Visit Japan Web for both of us' },
        sub: {
          he: 'לשמור את קודי ה־QR של הביקורת והמכס, שיעבדו גם בלי אינטרנט',
          en: 'Save the immigration and customs QR codes so they work offline',
        },
      },
      {
        id: 'sushi',
        title: { he: 'להזמין Vegan Sushi Tokyo ל־12.11', en: 'Book Vegan Sushi Tokyo for 12.11' },
        sub: { he: 'בהזמנה בלבד, עם פיקדון מראש', en: 'Reservation only, with a deposit' },
      },
      {
        id: 'minamo',
        title: {
          he: 'לשריין את Shojin Sushi Minamo ל־8.11',
          en: 'Reserve Shojin Sushi Minamo for 8.11',
        },
        sub: { he: 'מעט מקומות ליד הדלפק', en: 'Only a few counter seats' },
      },
      {
        id: 'insurance',
        title: { he: 'ביטוח נסיעות', en: 'Travel insurance' },
        sub: { he: 'לשתינו, כולל ביטול', en: 'For both of us, with cancellation' },
      },
      {
        id: 'passport',
        title: { he: 'לבדוק תוקף דרכונים', en: 'Check passport validity' },
        sub: { he: 'צריך להיות בתוקף לכל השהייה', en: 'Must be valid for the whole stay' },
      },
    ],
  },
  {
    id: 'week',
    title: { he: 'שבוע לפני', en: 'A week before' },
    items: [
      {
        id: 'esim',
        title: { he: 'eSIM לשתינו', en: 'eSIM for both of us' },
        sub: { he: 'להתקין מראש, להפעיל בנחיתה', en: 'Install ahead, turn on after landing' },
      },
      {
        id: 'suica',
        title: { he: 'Suica בארנק של הטלפון', en: 'Suica in the phone wallet' },
        sub: {
          he: 'לטעון קצת כסף לרכבות ולמינימרקטים',
          en: 'Top up a little for trains and konbini',
        },
      },
      {
        id: 'maps',
        title: { he: 'מפות אופליין בגוגל מפות', en: 'Offline Google Maps' },
        sub: { he: 'טוקיו, קובה, אוסקה וקיוטו', en: 'Tokyo, Kobe, Osaka and Kyoto' },
      },
      {
        id: 'cash',
        title: { he: 'קצת ין במזומן', en: 'Some yen in cash' },
        sub: { he: 'למקדשים, לשוקים ולמכונות', en: 'For temples, markets and machines' },
      },
      {
        id: 'card',
        title: {
          he: 'כרטיס אשראי בלי עמלת מט״ח',
          en: 'A credit card with no foreign-currency fee',
        },
      },
      {
        id: 'plug',
        title: { he: 'מתאם חשמל ליפן', en: 'Japan plug adapter' },
        sub: { he: 'שקע עם שני פינים שטוחים', en: 'Two flat pins' },
      },
      {
        id: 'teamlab',
        title: { he: 'מכנסיים שאפשר להפשיל', en: 'Trousers you can roll up' },
        sub: { he: 'ל־teamLab ב־4.11, הולכים במים', en: 'For teamLab on 4.11, you walk in water' },
      },
      {
        id: 'socks',
        title: { he: 'גרביים יפות', en: 'Nice socks' },
        sub: {
          he: 'חולצים נעליים במקדשים, בגיון ובחלק מהמסעדות',
          en: 'Shoes come off at temples, in Gion and at some restaurants',
        },
      },
      {
        id: 'shabbat',
        title: { he: 'דברים לשבת', en: 'Things for Shabbat' },
        sub: { he: 'שתי שבתות: קובה וטוקיו', en: 'Two Shabbats: Kobe and Tokyo' },
      },
    ],
  },
  {
    id: 'dayBefore',
    title: { he: 'יום לפני', en: 'The day before' },
    items: [
      {
        id: 'checkin',
        title: { he: 'צ׳ק־אין אונליין ל־LY91', en: 'Online check-in for LY91' },
        sub: { he: 'נפתח 24 שעות לפני ההמראה', en: 'Opens 24 hours before take-off' },
      },
      {
        id: 'offline',
        title: { he: 'שמירת האפליקציה לאופליין', en: 'Save the app for offline use' },
        sub: {
          he: 'כל הטיול בטלפון, גם בלי קליטה',
          en: 'The whole trip on the phone, even without signal',
        },
      },
      { id: 'battery', title: { he: 'להטעין סוללה ניידת', en: 'Charge the power bank' } },
      {
        id: 'tickets',
        title: { he: 'לפתוח את הכרטיסים מהדרייב', en: 'Open the tickets from Drive' },
        sub: {
          he: 'teamLab, השינקנסן, הקימונו ויוניברסל',
          en: 'teamLab, the Shinkansen, the kimono and Universal',
        },
      },
    ],
  },
  {
    id: 'flightDay',
    title: { he: 'ביום הטיסה', en: 'Flight day' },
    items: [
      {
        id: 'airport',
        title: { he: 'להגיע לנתב״ג T3 עד 16:00', en: 'Be at Ben Gurion T3 by 16:00' },
        sub: { he: 'שלוש שעות לפני ההמראה ב־19:00', en: 'Three hours before the 19:00 take-off' },
      },
      {
        id: 'qr',
        title: { he: 'QR של Visit Japan Web בהישג יד', en: 'Visit Japan Web QR within reach' },
        sub: { he: 'להראות בנחיתה בנריטה', en: 'To show on landing at Narita' },
      },
    ],
  },
];

export const checklistItems: ChecklistItem[] = checklistGroups.flatMap((group) => group.items);
