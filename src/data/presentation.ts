import type { EventPresentation } from './types';

/**
 * Friendly display copy per event ID. Events without an entry show their source title and note;
 * the full source note always stays available in the event details.
 */
export const eventPresentation: Record<string, EventPresentation> = {
  'd2-01': {
    title: 'ממריאות ליפן ✈︎',
    description: 'LY91 מנתב״ג. מגיעות עם מרווח לצ׳ק־אין ולביטחון.',
  },
  'd3-01': {
    title: 'נוחתות בנריטה',
    description: 'שעת הנחיתה לפי כרטיס הטיסה — לא שעת היציאה מהשדה.',
  },
  'd4-01': {
    title: 'להיכנס לעולם של teamLab',
    description: 'אור, מים ואמנות שעוטפת אתכן. מתחילות את הבוקר ב־teamLab Planets.',
  },
  'd4-02': {
    title: 'ראמן טבעוני ב־UZU',
    description: 'הפסקת צהריים במתחם teamLab. בתכנון, ללא הזמנה; שעות הפעילות טרם אומתו.',
  },
  'd4-03': {
    title: 'אחר צהריים בגינזה',
    description: 'חנויות עיצוב, אופנה ומוצרי טיול. סיבוב בין Ginza Itoya ו־GINZA SIX.',
  },
  'shop-itoya-ginza': {
    title: 'עצירה קטנה ב־Ginza Itoya',
    description: 'מחברות יפות, נייר יפני וציוד ציור. מקום להשאיר בו קצת מקום במזוודה.',
  },
  'd4-04': {
    title: 'ארוחת ערב ב־KOMEDA is',
    description:
      'מסיימות את הסיבוב בגינזה בארוחה. טבעוני לפי התכנון המקורי; שעות הפעילות דורשות אימות.',
  },
  'gym-2037-11-04': {
    title: 'עוד קצת אנרגיה? אימון במלון',
    description:
      'אימון אופציונלי ראשון לשבוע. שעות, ציוד ותנאי כניסה לפי התכנון המקורי — נדרש אימות.',
  },
  'd5-03': {
    title: 'שינקנסן לקובה',
    description: 'NOZOMI 53 משינגאווה. להיות בשערים עד 16:45, עם QR מ־SmartEX או IC משויך.',
  },
  'd6-03': {
    title: 'חזרה למלון והכנות לשבת',
    description: 'זמן רגוע להתארגן לפני הדלקת נרות. הכביסה עברה לבוקר יום ראשון 8.11.',
  },
  'd6-04': {
    title: 'ליל שבת בחב״ד קובה',
    description: 'סעודת שישי לשתיכן. השעה המדויקת לא מופיעה באישור — לוודא מול חב״ד מראש.',
  },
  'd7-01': {
    title: 'שבת שלום מקובה',
    description: 'תפילות וסעודות בחב״ד. מועדי התפילות והסעודות משתנים — לבדוק מול חב״ד.',
  },
  'd9-03': {
    title: 'קימונו בגיון',
    description: 'MOMO, סניף Gion ב־Yamatocho 12 — לא סניף אחר.',
  },
  'd9-05': {
    title: 'ארוחת ערב ב־UZU Kyoto',
    description: 'מוזמן ל־18:00 בדיוק (לא 18:30). עד 75 דקות ישיבה; בלי בושם.',
  },
  'd10-01': {
    title: 'יום ביוניברסל!',
    description: 'שני Studio Pass לכניסה — להדפיס את שני ה־QR המלאים. ה־Express אינו תחליף.',
  },
  'd11-04': {
    title: 'שינקנסן חזרה לטוקיו',
    description: 'NOZOMI 46 משין־אוסקה. להיות באזור הרציף עד 18:00.',
  },
  'd12-04': {
    title: 'ספא ראש ב־Shibuya ANNEX',
    description: 'טיפול של 110 דקות לשתיכן, באותו חדר. איחור של מעל 10 דקות עלול לקצר את הטיפול.',
  },
  'd13-05': {
    title: 'ליל שבת בחב״ד טוקיו',
    description: 'סעודת שישי לשתיכן. מגיעות מוקדם לפני כניסת שבת.',
  },
  'd14-01': {
    title: 'שבת בטוקיו',
    description: 'תפילות וסעודות בחב״ד. לוודא שעות וכתובת מול האישור שהתקבל.',
  },
  'laundry-kobe': {
    title: 'כביסה בבוקר רגוע',
    description:
      'הכביסה השבועית הראשונה, בחדר הכביסה של המלון. מתחילות ב־07:00 כי הייבוש איטי; לסיים לפני הצ׳ק־אאוט ב־11:00.',
  },
  'laundry-osaka-backup': {
    title: 'כביסה קטנה — רק אם צריך',
    description: 'גיבוי בלבד, אם חסרים בגדים לפני הימים באומורי. מכונה אחת לפני הצ׳ק־אאוט.',
  },
  'laundry-oriental': {
    title: 'כביסה לפני דיסני',
    description:
      'מיד אחרי הצ׳ק־אין, בחדר הכביסה ליד הדלפק. תשלום באשראי או QR בלבד, בלי צורך באבקה. מה שלא התייבש — לתלות בחדר.',
  },
  'luggage-narita-sameday': {
    title: 'מזוודות מנריטה ישר למלון',
    description:
      'אופציה: דלפק SAGAWA באולם ההגעה, עד 14:00. המזוודות מחכות ב־Shinagawa Prince, ואתן אוכלות בלעדיהן.',
  },
  'luggage-to-kobe': {
    title: 'מזוודות לקובה',
    description:
      'אופציה: להשאיר בדלפק לפני היציאה. מגיעות ל־CANDEO Kobe ב־5.11, ושוב לא צריך לחזור למלון לפני השינקנסן.',
  },
  'luggage-kobe-osaka': {
    title: 'מזוודות לאוסקה',
    description:
      'ברירת מחדל: איתנו ב־Hanshin, ומשאירות בדלפק של CANDEO Osaka Namba. Yamato באותו יום רק אם שני המלונות אישרו מראש.',
  },
  'luggage-to-omori': {
    title: 'מזוודות לאומורי',
    description:
      'מומלץ: להשאיר בדלפק לפני USJ. מגיעות ל־MYSTAYS Omori ב־11.11, ויום המעבר בלי מזוודות.',
  },
  'luggage-to-oriental': {
    title: 'מזוודות למלון בדיסני',
    description:
      'אופציה: לשלוח בצ׳ק־אאוט. מגיעות ל־Oriental ב־16.11, ולא צריך לחזור לאומורי לאסוף אותן.',
  },
  'd16-01': {
    title: 'יום ב־Tokyo Disneyland',
    description: 'שני כרטיסים, QR נפרד לכל אחת. שעת הפתיחה — בלוח הרשמי.',
  },
  'd17-01': {
    title: 'יום ב־Tokyo DisneySea',
    description: 'שני כרטיסים, QR נפרד לכל אחת.',
  },
  'd18-03': {
    title: 'טסות הביתה',
    description: 'LY92 מנריטה T1. נוחתות בנתב״ג באותו ערב.',
  },
};

/** Bookings that are not confirmed "for both of you" (one-traveller bookings, flight photos). */
export const confirmedFor: Record<string, 'one' | 'booking'> = {
  'd2-01': 'booking',
  'd3-01': 'booking',
  'd18-03': 'booking',
};
