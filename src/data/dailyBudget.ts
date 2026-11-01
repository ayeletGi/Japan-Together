/**
 * The daily budget, per person: what is still to pay in Japan each day (food, things paid on the
 * spot, shopping in the day's area), plus local rides and luggage forwarding. Prepaid bookings
 * (flights, hotels, teamLab, USJ, Disney, the Shinkansen on SmartEX, Chabad Shabbat meals, UZU
 * Kyoto) are left out. Built 19.10.2026: prices with a `source` were checked online then; every
 * other price is an estimate by the kind of place, and shopping amounts are targets we chose.
 */

export type DailyKind = 'food' | 'extra' | 'shop';

export interface DailyItem {
  label: string;
  /** Yen per person. */
  yen?: number;
  /** Shekels per person, for a price we know in shekels (the kimono). */
  ils?: number;
  /** Optional in the plan; still counted, so the budget covers it. */
  optional?: boolean;
  /** Where a checked price comes from. */
  source?: string;
  /** Why it is paid in cash. Without it, it goes on the card. */
  cash?: string;
  /** The plan stop (event id) the price belongs to, so the day's timeline can show it. */
  stop?: string;
}

export interface DailyDay {
  date: string;
  area: string;
  food: DailyItem[];
  extra: DailyItem[];
  shop: DailyItem[];
  /** The food budget we chose for the day, yen per person (the items are only my estimate). */
  foodBudget: number;
  /** Local rides, yen per person, at Suica fares unless `notSuica`. */
  rides: number;
  /** Part of `rides` that is not on Suica (the N'EX and the limousine), paid by card. */
  notSuica?: number;
  /** Forwarding one regular suitcase, yen per person. */
  luggage?: {
    yen: number;
    note: string;
    /** Sent from a hotel desk, which often takes cash only. */ hotelDesk?: boolean;
  };
  tip?: string;
}

/** About ₪3,000 shopping for the whole trip, spread over the days by each day's shopping list. */
export const SHOP_BUDGET_YEN = 153_000;
/** Pocket cash each day for vending machines, lockers, stalls and small eateries (out of food). */
export const POCKET_YEN = 1_000;
/** Emergency cash to carry, per person, outside the budget. */
export const EMERGENCY_YEN = 10_000;

export const CASH_WHY = {
  ticketMachine: 'הזמנה במכונת כרטיסים; לא מצאנו אם מקבלים כרטיס',
  noCardInfo: 'לא מצאנו אם הקופה מקבלת אשראי',
  smallBakery: 'מאפייה קטנה; לא מצאנו אם מקבלים כרטיס',
  coins: 'מכונות מטבעות של ¥100',
  stalls: 'דוכנים ומקדשים, כמעט תמיד מזומן',
  smallPlace: 'מסעדה ותיקה וקטנה; לא מצאנו אם מקבלים כרטיס',
} as const;

export const dailyBudget: DailyDay[] = [
  {
    date: '2037-11-03',
    area: 'נחיתה · טוקיו',
    food: [
      {
        label: 'T’s Tantan בתחנת Tokyo',
        yen: 1600,
        source: 'ממוצע ¥1,500 לפי מדריך',
        stop: 'd3-04',
      },
      { label: 'TSUMINAKI Mapo Tofu', yen: 1800, stop: 'd3-05' },
      { label: 'קנייה ראשונה: ביצים, חלב, פירות, אורז', yen: 1500 },
      { label: 'מים וחטיפים', yen: 600 },
    ],
    extra: [],
    shop: [
      { label: 'ערכת מטבח ב־Daiso / Don Quijote (חצי)', yen: 1500 },
      { label: 'סיר חשמלי קטן לחדר (חצי)', yen: 2500 },
    ],
    foodBudget: 8000,
    rides: 3750,
    notSuica: 3140,
    luggage: { yen: 2840, note: 'SAGAWA מנריטה (עד 140 ס״מ)' },
    tip: 'קונות את ערכת המטבח כבר היום, כדי לבשל מהערב הראשון.',
  },
  {
    date: '2037-11-04',
    area: 'Toyosu · Ginza',
    food: [
      {
        label: 'Vegan Ramen UZU Tokyo',
        yen: 2000,
        source: 'ראמן מיסו ¥2,000 באתר הרשמי',
        stop: 'd4-02',
      },
      { label: 'KOMEDA is', yen: 1800, stop: 'd4-04' },
      { label: 'ארוחת בוקר בחדר', yen: 300 },
      { label: 'חטיפים ושתייה', yen: 600 },
    ],
    extra: [],
    shop: [
      { label: 'Ginza Itoya: מחברות, נייר, ציוד ציור', yen: 4000, stop: 'shop-itoya-ginza' },
      { label: 'UNIQLO / Loft Ginza', yen: 4000, stop: 'd4-03' },
    ],
    foodBudget: 7500,
    rides: 1000,
    luggage: { yen: 3160, note: 'Yamato לקובה (160 ס״מ)', hotelDesk: true },
    tip: 'גינזה יקרה. Itoya הוא העיקר; את האופנה עדיף להשאיר לאוסקה ושיבויה.',
  },
  {
    date: '2037-11-05',
    area: 'Nakano → קובה',
    food: [
      { label: 'צהריים ב־Nakano', yen: 1500 },
      { label: 'אקיבן / מינימרקט לרכבת', yen: 1200, stop: 'd5-03' },
      { label: 'חטיפים', yen: 500 },
    ],
    extra: [],
    shop: [
      { label: 'Nakano Broadway: מנגה ואספנות', yen: 3000, stop: 'd5-02' },
      { label: 'Mandarake: קלפי פוקימון בודדים (לנבו)', yen: 3000, stop: 'd5-02' },
    ],
    foodBudget: 7000,
    rides: 850,
    tip: 'קלפים בודדים זולים כאן יותר מאשר ב־Pokémon Center.',
  },
  {
    date: '2037-11-06',
    area: 'קובה · ערב שבת',
    food: [
      { label: 'Veggie Junkies Burger', yen: 1800, cash: CASH_WHY.ticketMachine, stop: 'd6-02' },
      { label: 'קניות לשבת: פירות, שתייה, תוספות', yen: 1500 },
      { label: 'ארוחת בוקר בחדר', yen: 300 },
    ],
    extra: [
      {
        label: 'רכבל Nunobiki הלוך־חזור + גן הצמחים',
        yen: 2500,
        source: '¥2,500 מ־1.4.2026, אתר התיירות של Hyogo',
        cash: CASH_WHY.noCardInfo,
        stop: 'd6-01',
      },
    ],
    shop: [],
    foodBudget: 6000,
    rides: 400,
    tip: 'ארוחת ליל שבת בחב״ד כבר שולמה.',
  },
  {
    date: '2037-11-07',
    area: 'שבת בקובה',
    food: [
      { label: 'Vegan Bread 4690 במוצ״ש', yen: 1000, cash: CASH_WHY.smallBakery, stop: 'd7-02' },
    ],
    extra: [
      {
        label: 'Gold’s Gym Kobe, כניסה יומית',
        yen: 2860,
        optional: true,
        source: 'מהערות חדר הכושר באפליקציה',
        stop: 'gym-kobe-motzash',
      },
    ],
    shop: [],
    foodBudget: 2500,
    rides: 0,
    tip: 'שבת בחב״ד שולמה. הכניסה ל־Gold’s עוד לא אושרה.',
  },
  {
    date: '2037-11-08',
    area: 'קובה → אוסקה',
    food: [
      { label: 'MERCY Vegan Factory', yen: 2000, source: 'סט צהריים ¥1,980', stop: 'd8-03' },
      {
        label: 'Shojin Sushi Minamo',
        yen: 3500,
        source: '¥450–880 ליחידה לפי ביקורות; סכום הארוחה הערכה',
        stop: 'd8-06',
      },
      { label: 'חטיפים ושתייה', yen: 700 },
    ],
    extra: [{ label: 'כביסה 1/2 (חצי)', yen: 700, cash: CASH_WHY.coins }],
    shop: [
      { label: 'Shinsaibashi: UNIQLO, GU, אופנה', yen: 6000, stop: 'osaka-shinsaibashi-shopping' },
      { label: 'בתי מרקחת: קוסמטיקה וטיפוח', yen: 4000, stop: 'd8-05' },
      { label: 'Pokémon Center Osaka DX', yen: 2000, stop: 'd8-05' },
    ],
    foodBudget: 8000,
    rides: 650,
    tip: 'יום הקניות הכי משתלם בטיול: הכל בהליכה, ומחירי האופנה באוסקה נוחים יותר מטוקיו.',
  },
  {
    date: '2037-11-09',
    area: 'קיוטו · קימונו',
    food: [
      { label: 'ארוחת בוקר מוקדמת', yen: 800, stop: 'd9-01' },
      {
        label: 'ZIRAEL בגיון',
        yen: 2000,
        source: 'צלחת ¥1,500 ב־2023; הערכה עם עלייה',
        stop: 'd9-04',
      },
      { label: 'מאצ׳ה ומתוק בגיון', yen: 800, stop: 'gion-walk' },
    ],
    extra: [
      {
        label: 'Kimono Rental MOMO (חצי מ־₪870)',
        ils: 435,
        source: 'הערכה מגיליון התקציב',
        stop: 'd9-03',
      },
    ],
    shop: [
      {
        label: 'מזכרות בגיון: מניפות, ממתקים',
        yen: 3000,
        cash: CASH_WHY.stalls,
        stop: 'gion-walk',
      },
    ],
    foodBudget: 6000,
    rides: 1700,
    tip: 'ארוחת הערב ב־UZU Kyoto כבר שולמה. הקימונו נגבה בחנות.',
  },
  {
    date: '2037-11-10',
    area: 'Universal Studios',
    food: [
      { label: 'אוכל ושתייה בפארק', yen: 2500, stop: 'd10-01' },
      { label: 'חטיפים בפארק', yen: 800, stop: 'd10-01' },
      { label: 'THE SECONDROOM', yen: 2500, optional: true, stop: 'd10-08' },
    ],
    extra: [],
    shop: [{ label: 'מרצ׳נדייז Nintendo / Minions', yen: 4000, stop: 'd10-04' }],
    foodBudget: 7500,
    rides: 800,
    luggage: { yen: 3160, note: 'Yamato לאומורי (160 ס״מ)', hotelDesk: true },
    tip: 'כניסה ו־Express שולמו. לקחת חטיפי חלבון מהבית לתורים.',
  },
  {
    date: '2037-11-11',
    area: 'אוסקה → טוקיו',
    food: [
      {
        label: 'Green Earth',
        yen: 1300,
        source: 'סט צהריים כ־¥1,100 לפי ביקורות',
        cash: CASH_WHY.smallPlace,
        stop: 'd11-02',
      },
      { label: 'אקיבן לשינקנסן', yen: 1300, stop: 'd11-04' },
      { label: 'ארוחת בוקר בחדר', yen: 300 },
      { label: 'חטיפים', yen: 500 },
    ],
    extra: [],
    shop: [
      { label: 'Shinsaibashi, קניות אחרונות', yen: 4000, stop: 'd11-03' },
      { label: 'Tools Umeda: COPIC', yen: 4000, optional: true, stop: 'tools-osaka-option' },
    ],
    foodBudget: 7000,
    rides: 600,
    tip: 'COPIC רק אם יש זמן לפני הרכבת; אחרת Sekaido בטוקיו ב־13.11.',
  },
  {
    date: '2037-11-12',
    area: 'Shibuya · Harajuku',
    food: [
      { label: 'Brown Rice Tokyo', yen: 2200, stop: 'd12-02' },
      { label: 'Vegan Sushi Tokyo', yen: 3500, optional: true, stop: 'd12-03' },
      { label: 'ארוחת בוקר בחדר', yen: 300 },
      { label: 'חטיפים', yen: 700 },
    ],
    extra: [
      { label: 'Shibuya ANNEX Head Spa, 110 דק׳', yen: 19250, source: 'מההזמנה', stop: 'd12-04' },
    ],
    shop: [
      { label: 'SHIBUYA109 / PARCO: אופנה', yen: 6000, stop: 'shibuya-109' },
      { label: 'Kiddy Land + Takeshita', yen: 3000, stop: 'harajuku-shopping' },
      { label: 'Pokémon Center Shibuya', yen: 3000, stop: 'shibuya-parco' },
    ],
    foodBudget: 8000,
    rides: 700,
    tip: 'היום היקר ביותר. הספא נגבה באשראי בלבד, במקום.',
  },
  {
    date: '2037-11-13',
    area: 'Shinjuku · Nakano · ערב שבת',
    food: [
      { label: 'HealthyTOKYO, ארוחת בוקר', yen: 1500, stop: 'd13-01' },
      {
        label: 'AIN SOPH. Journey',
        yen: 2500,
        source: 'סטים מ־¥1,270 ב־2023, המחירים עלו',
        stop: 'd13-03',
      },
      { label: 'קניות לשבת', yen: 1000 },
    ],
    extra: [
      {
        label: 'Shinjuku Gyoen, כניסה (תערוכת חרציות 1–15.11)',
        yen: 500,
        source: '¥500, משרד הסביבה היפני',
        stop: 'd13-02',
      },
    ],
    shop: [
      { label: 'Sekaido: ציוד ציור ומנגה', yen: 4000, stop: 'sekaido-shinjuku' },
      { label: 'Nakano Broadway, השלמות', yen: 2000, stop: 'd13-04' },
    ],
    foodBudget: 6500,
    rides: 1000,
    tip: 'ארוחת ליל שבת בחב״ד טוקיו כבר שולמה.',
  },
  {
    date: '2037-11-14',
    area: 'שבת בטוקיו',
    food: [{ label: 'Vegan Sushi BABYLON במוצ״ש', yen: 2500, optional: true, stop: 'd14-02' }],
    extra: [
      {
        label: 'Gold’s Gym Omori, כניסה יומית',
        yen: 2860,
        optional: true,
        source: 'מהערות חדר הכושר באפליקציה',
        stop: 'gym-2037-11-14',
      },
    ],
    shop: [],
    foodBudget: 3500,
    rides: 0,
    tip: 'שבת בחב״ד שולמה. במוצ״ש בוחרות: אימון או סושי.',
  },
  {
    date: '2037-11-15',
    area: 'Shibuya · Ebisu → מלון דיסני',
    food: [
      { label: 'Hemp Cafe Tokyo', yen: 1800, stop: 'd15-03' },
      { label: 'T’s Tantan', yen: 1600, stop: 'd15-04' },
      { label: 'ארוחת בוקר בחדר', yen: 300 },
      { label: 'קניות לפיקניק בדיסני', yen: 1500 },
    ],
    extra: [
      {
        label: 'Shibuya Sky (באינטרנט, לפני 15:00)',
        yen: 2700,
        optional: true,
        source: '¥2,700 באינטרנט, ¥3,000 בקופה',
        stop: 'd15-02',
      },
      { label: 'כביסה 2/2 (חצי)', yen: 700, cash: CASH_WHY.coins },
    ],
    shop: [{ label: 'Shibuya: קניות אחרונות ומזכרות', yen: 6000, stop: 'shibuya-markets' }],
    foodBudget: 8000,
    rides: 850,
    luggage: { yen: 3020, note: 'Yamato ל־Oriental (160 ס״מ)', hotelDesk: true },
    tip: 'קונות היום את האוכל לשני ימי הפארק; Lawson פתוח 24 שעות במלון.',
  },
  {
    date: '2037-11-16',
    area: 'Tokyo Disneyland',
    food: [
      { label: 'פופקורן, צ׳ורוס ושתייה בפארק', yen: 1500, stop: 'd16-01' },
      { label: 'ערב מ־Lawson במלון', yen: 1000 },
      { label: 'ארוחת בוקר בחדר', yen: 300 },
    ],
    extra: [],
    shop: [{ label: 'מרצ׳נדייז דיסני', yen: 4000, stop: 'd16-01' }],
    foodBudget: 6500,
    rides: 0,
    tip: 'הכרטיס והשאטל כבר מכוסים.',
  },
  {
    date: '2037-11-17',
    area: 'Tokyo DisneySea',
    food: [
      { label: 'חטיפים ושתייה בפארק', yen: 1500, stop: 'd17-01' },
      { label: 'ערב מ־Lawson במלון', yen: 1000 },
      { label: 'ארוחת בוקר בחדר', yen: 300 },
    ],
    extra: [],
    shop: [{ label: 'מרצ׳נדייז DisneySea', yen: 4000, stop: 'd17-01' }],
    foodBudget: 6500,
    rides: 0,
    tip: 'להשאיר מקום במזוודה, מחר טסות.',
  },
  {
    date: '2037-11-18',
    area: 'טיסה הביתה',
    food: [
      { label: 'ארוחת בוקר', yen: 500 },
      { label: 'אוכל בנריטה', yen: 1500 },
    ],
    extra: [],
    shop: [{ label: 'Duty free בנריטה: ממתקים, KitKat', yen: 3000 }],
    foodBudget: 4500,
    // The airport limousine (¥2,900 each) was prepaid on 1.11 and is in the trip costs.
    rides: 0,
    tip: 'האוטובוס לנריטה כבר שולם. לבזבז את המטבעות האחרונים בשדה.',
  },
];
