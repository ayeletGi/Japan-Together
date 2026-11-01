/**
 * Shopping by day, from the original plan (SHOPPING_RECS, SHOP_HOURS and SHOPPING_DAY_FOCUS). The first pick of each
 * day is "my recommendation". Hours are as in the original plan and are not re-verified, except for picks
 * with a `check`: those (cosmetics, Pokémon cards, knives, watches, rice cookers and more) were added
 * on 13.10.2026.
 */

import type { MoreLink, SourceCheck } from './types';

export interface ShopPick {
  name: string;
  /** What they sell. */
  kind: string;
  hours: string;
  why: string;
  website: string;
  /** The original plan marks the strongest picks with a star. */
  starred: boolean;
  mapsQuery: string;
  /** Added after the original plan: where the details were checked. */
  check?: SourceCheck;
}

export interface ShopHours {
  name: string;
  hours: string;
  note: string;
  website: string;
}

export type ShopCity = 'tokyo' | 'osaka';
export type ShopCategory =
  | 'pokemon'
  | 'cosmetics'
  | 'art'
  | 'manga'
  | 'fashion'
  | 'knives'
  | 'watches'
  | 'appliances'
  | 'other';
export const shopCategories: ShopCategory[] = [
  'pokemon',
  'cosmetics',
  'art',
  'manga',
  'fashion',
  'knives',
  'watches',
  'appliances',
  'other',
];

/** Filter group for a pick, read from its Hebrew `kind`. The first matching group wins. */
const categoryPatterns: [ShopCategory, RegExp][] = [
  ['pokemon', /פוקימון/],
  ['cosmetics', /קוסמטיקה|טיפוח|איפור/],
  ['art', /COPIC|ציור|עטים|נייר|כלי כתיבה|סקצ/],
  ['manga', /מנגה|אנימה|קומיקס|דמויות|פופ/],
  ['fashion', /אופנה|בגדים|GU/],
  ['knives', /סכינ/],
  ['appliances', /סיר אורז|מוצרי חשמל/],
  ['watches', /שעונ/],
];
export const shopCategory = (shop: ShopPick): ShopCategory =>
  categoryPatterns.find(([, pattern]) => pattern.test(shop.kind))?.[0] ?? 'other';

export interface ShoppingDay {
  date: string;
  city: ShopCity;
  area: string;
  focus: string;
  picks: ShopPick[];
  hours: ShopHours[];
}

const pick = (
  name: string,
  kind: string,
  hours: string,
  why: string,
  website: string,
  mapsQuery: string,
  starred = false,
): ShopPick => ({ name, kind, hours, why, website, starred, mapsQuery });

const CHECKED = '2037-10-13';
const official = (link: string): SourceCheck => ({
  date: CHECKED,
  link,
  official: true,
});
const listing = (source: string, link: string): SourceCheck => ({
  date: CHECKED,
  source,
  link,
  official: false,
});
const checked = (shop: ShopPick, check: SourceCheck): ShopPick => ({ ...shop, check });

const POKEMON_LOTTERY =
  'סטים חדשים (כמו 30th CELEBRATION) נמכרים כאן בהגרלה בלבד לפי הודעות החנות מספטמבר–אוקטובר 2026; קלפים בודדים — בחנויות הקלפים.';
const pokemonCenterShibuya = checked(
  pick(
    'Pokémon Center Shibuya',
    'פוקימון / קלפים / מרצ׳נדייז',
    'כל יום 10:00–21:00',
    `בקומה 6 של Shibuya PARCO, יחד עם Nintendo TOKYO. ${POKEMON_LOTTERY}`,
    'https://shop.pokemon.co.jp/ja/shop/pokemoncenter-shibuya/',
    'Pokemon Center Shibuya PARCO 6F',
  ),
  official('https://shop.pokemon.co.jp/ja/shop/pokemoncenter-shibuya/'),
);
const pokemonCenterOsaka = checked(
  pick(
    'Pokémon Center Osaka DX',
    'פוקימון / קלפים / מרצ׳נדייז',
    'כל יום 10:00–20:00',
    `קומה 9 ב־Daimaru Shinsaibashi (הבניין הראשי), מחובר ליציאה 4 של תחנת Shinsaibashi. ${POKEMON_LOTTERY}`,
    'https://shop.pokemon.co.jp/ja/shop/pokemoncenter-osakadx/',
    'Pokemon Center Osaka DX Daimaru Shinsaibashi',
  ),
  official('https://shop.pokemon.co.jp/ja/shop/pokemoncenter-osakadx/'),
);
const mandarakeCards = checked(
  pick(
    'Mandarake カード館 (Nakano Broadway 2F)',
    'קלפי פוקימון בודדים',
    'כל יום 12:00–20:00',
    'אולם הקלפים של Mandarake בקומה 2: קלסרים של קלפי פוקימון בודדים, גם זולים וגם נדירים. פטור ממס עם דרכון.',
    'https://www.mandarake.co.jp/dir/nkn/',
    'Mandarake Nakano Broadway',
  ),
  official('https://www.mandarake.co.jp/dir/nkn/'),
);
const shinsaibashiGuide =
  'https://livejapan.com/en/in-kansai/in-pref-osaka/in-namba_dotonbori_shinsaibashi/article-a2000456/';

const KNIFE_LUGGAGE = 'סכינים רק במזוודה הגדולה — אסור בתיק היד בטיסה.';
/** Japanese rice cookers are 100V; Israel is 230V/50Hz, so only the export line works without a transformer. */
const RICE_COOKER_TIP =
  'לבקש דגם לחו״ל (海外向け) של 220–230V — הדגמים היפניים הרגילים הם 100V ולא יעבדו בישראל בלי שנאי כבד. לדוגמה Zojirushi NP-BQH10 או Tiger JKT-W10W, עם תפריט והוראות באנגלית. התקע אירופאי (SE) — צריך מתאם לשקע ישראלי עם הארקה. לבדוק אחריות בינלאומית.';
const riceCookerGuide =
  'https://livejapan.com/en/in-tokyo/in-pref-tokyo/in-akihabara/article-a0003241/';
const yodobashiShinjuku = checked(
  pick(
    'Yodobashi Camera Shinjuku West',
    'סיר אורז / מוצרי חשמל / שעונים',
    'כל יום 9:30–22:00 (לפי אתר רשימות)',
    `ליד היציאה המערבית של Shinjuku. ${RICE_COOKER_TIP} יש גם קומת שעונים עם Seiko, Citizen ו־G-Shock.`,
    'https://www.yodobashi.com/ec/store/0011/',
    'Yodobashi Camera Shinjuku West Main Store',
  ),
  listing('Tokyo Tourist Info', 'https://tokyotouristinfo.com/en/detail/M0286'),
);

export const shoppingDays: ShoppingDay[] = [
  {
    date: '2037-11-04',
    city: 'tokyo',
    area: 'Ginza',
    focus:
      'גינזה: קודם Itoya לסקצ׳בוקים/עיצוב, ואז GINZA SIX אם יש כוח. חנות COPIC הרשמית היא סטייה נפרדת.',
    picks: [
      pick(
        'Ginza Itoya',
        'סקצ׳בוקים / עטים / נייר',
        'לרוב 10:00–20:00; לבדוק',
        'עצירה טבעית בגינזה אחרי teamLab. לא בהכרח כל צבעי COPIC במלאי.',
        'https://www.ito-ya.co.jp/',
        'Ginza Itoya 2-7-15 Ginza Tokyo',
        true,
      ),
      pick(
        'GINZA SIX',
        'אופנה / עיצוב',
        'חנויות לרוב 10:30–20:30',
        'אם מתחשק לכן מותגים בינלאומיים וקצת עיצוב יפני בלי לנסוע לרובע חדש.',
        'https://ginza6.tokyo/',
        'GINZA SIX Tokyo',
      ),
      pick(
        'Tools Ochanomizu — רק אם COPIC בראש סדר העדיפויות',
        'COPIC רשמי',
        'ב׳–ו׳ 09:30–19:00; סופ״ש 10:00–18:30',
        'החנות הרשמית עם מרקרים, אינקים וניבים. דורש סטייה ייעודית מגינזה; אפשר לשמור ליום אחר.',
        'https://copic.jp/en/campaign/how-to-buy-copic-in-japan',
        'Tools Ochanomizu Tokyo',
      ),
      checked(
        pick(
          'SHISEIDO THE STORE',
          'קוסמטיקה וטיפוח יפני',
          'כל יום 10:00–20:00 (לפי אתר רשימות)',
          'חנות הדגל של Shiseido בגינזה: כל המותגים של החברה, בדיקת עור ואיפור. קרוב ל־Itoya.',
          'https://tokyocheapo.com/place/shiseido-flagship-store-ginza/',
          'SHISEIDO THE STORE Ginza Tokyo',
        ),
        listing('Tokyo Cheapo', 'https://tokyocheapo.com/place/shiseido-flagship-store-ginza/'),
      ),
      checked(
        pick(
          'Grand Seiko Flagship Boutique Ginza',
          'שעונים יוקרתיים יפניים',
          'ב׳–ש׳ 11:00–20:00; א׳ וחגים 11:00–19:00',
          'חנות הדגל הגדולה של Grand Seiko ביפן, ברחוב Namiki בגינזה, עם דגמים שמיוחדים לבוטיק. אם רוצות שעון יפני יוקרתי אחד שווה — זה המקום.',
          'https://www.grand-seiko.com/global-en/news/20230623',
          'Grand Seiko Flagship Boutique Ginza 6-6-5 Ginza Tokyo',
          true,
        ),
        official('https://www.grand-seiko.com/global-en/news/20230623'),
      ),
      checked(
        pick(
          'SEIKO HOUSE GINZA (בניין Wako)',
          'שעונים / Seiko',
          'כל יום 11:00–19:00',
          'בניין שעון המגדל המפורסם בצומת גינזה. בקומות התחתונות הכלבו Wako עם שעונים יוקרתיים, ומעליו תצוגה של Seiko.',
          'https://www.seiko.co.jp/en/seiko_house_ginza/access/',
          'Wako Ginza 4-5-11 Ginza Tokyo',
        ),
        official('https://www.seiko.co.jp/en/seiko_house_ginza/access/'),
      ),
      checked(
        pick(
          'Nihonbashi Kiya',
          'סכינים יפניים למטבח',
          'ב׳–ו׳ 11:00–19:00; סופ״ש וחגים 10:30–19:00',
          `חנות סכינים ותיקה (מ־1792) ב־COREDO Muromachi, תחנה אחת מגינזה בקו Ginza. סכיני שף איכותיים, חריטת שם על הלהב. ${KNIFE_LUGGAGE}`,
          'https://mitsui-shopping-park.com/en/urban/coredo-muromachi/e/special01.html',
          'Nihonbashi Kiya COREDO Muromachi 1 Tokyo',
        ),
        official('https://mitsui-shopping-park.com/en/urban/muromachi/special/23-085/shop/1f109/'),
      ),
    ],
    hours: [
      {
        name: 'GINZA SIX',
        hours: '10:30–20:30',
        note: 'חנויות; מסעדות עד 23:00',
        website: 'https://www.ginza6.tokyo/hours/',
      },
    ],
  },
  {
    date: '2037-11-05',
    city: 'tokyo',
    area: 'Nakano',
    focus: 'נקאנו: מנגה, אנימה ואספנות לפני הרכבת של 17:19. לא לגלוש לאזורי קניות אחרים.',
    picks: [
      pick(
        'Nakano Broadway + Mandarake',
        'מנגה / אנימה',
        'רבות מהחנויות סביב 12:00–20:00',
        'מקום חובה לאספנות, מנגה ויד שנייה. אין צורך לעבור לעוד רובע באותו יום.',
        'https://www.gotokyo.org/en/spot/72/index.html',
        'Nakano Broadway Tokyo',
        true,
      ),
      pick(
        'Nakano Sun Mall',
        'קניות רחוב',
        'לפי חנות',
        'השדרה הצמודה לתחנה בדרך לברודוויי — נחמדה להליכה ולאוכל/חנויות.',
        'https://www.google.com/maps/search/?api=1&query=Nakano+Sun+Mall',
        'Nakano Sun Mall Tokyo',
      ),
      mandarakeCards,
    ],
    hours: [
      {
        name: 'Nakano Broadway',
        hours: '10:00–20:00',
        note: 'חנויות אנימה רבות נפתחות רק סביב 12:00; משתנה לפי חנות',
        website: 'https://www.gotokyo.org/en/spot/72/index.html',
      },
    ],
  },
  {
    date: '2037-11-08',
    city: 'osaka',
    area: 'Dotonbori + Shinsaibashi',
    focus: 'דוטונבורי + שינסאיבאשי: UNIQLO, אופנה מקומית ומזכרות — הכל באזור הליכתי אחד.',
    picks: [
      pick(
        'UNIQLO Shinsaibashi-suji',
        'בגדים / בסיס איכותי',
        '11:00–21:00',
        'מחירי יפן עלולים להיות טובים יותר; חנות מרכזית לאורך מסלול הקניות.',
        'https://map.uniqlo.com/jp/ja/detail/10101733',
        'UNIQLO Shinsaibashi-suji Osaka',
        true,
      ),
      pick(
        'Daimaru Shinsaibashi',
        'אופנה יפנית / בינלאומית',
        'לרוב 10:00–20:00',
        'מצוין לשלב אופנה וקוסמטיקה בשופינג בלי לצאת משינסאיבאשי.',
        'https://www.daimaru.co.jp/shinsaibashi-store/e/',
        'Daimaru Shinsaibashi Osaka',
      ),
      pick(
        'Don Quijote Dotonbori',
        'מזכרות / ציוד לטיול',
        '24 שעות',
        'להשלמות בסוף היום; לא צריך להקצות לו את שעות האור.',
        'https://www.donki.com/en/store/shop_detail.php?shop_id=110',
        'Don Quijote Dotonbori Osaka',
      ),
      pokemonCenterOsaka,
      checked(
        pick(
          'Card Labo Nipponbashi',
          'קלפי פוקימון בודדים',
          'ב׳–ו׳ 11:00–20:00; סופ״ש וחגים 10:00–20:00',
          'קומה 5, Nipponbashi-nishi (Den Den Town) — הליכה מהמלון בנמבה. לפי החנות, ויטרינת קלפי הפוקימון הגדולה באזור.',
          'https://www.c-labo.jp/shop/nipponbashi/',
          'Card Labo Nipponbashi 1-1-3 Nipponbashinishi Osaka',
        ),
        official('https://www.c-labo.jp/shop/nipponbashi/'),
      ),
      checked(
        pick(
          'Tsuruha Drug Shinsaibashi-suji',
          'טיפוח קוריאני ויפני',
          'עד 23:00 (לפי אתר רשימות)',
          'פארם גדול על מדרחוב שינסאיבאשי עם מבחר רחב של טיפוח קוריאני לצד מותגים יפניים. אפשר להשאיר לסוף הערב.',
          shinsaibashiGuide,
          'Tsuruha Drug Shinsaibashi-suji Osaka',
        ),
        listing('LIVE JAPAN', shinsaibashiGuide),
      ),
      checked(
        pick(
          'Matsumoto Kiyoshi Shinsaibashi South',
          'איפור וטיפוח יפני',
          '10:00–22:00 (לפי אתר רשימות)',
          'שתי קומות עם מבחר גדול של איפור יפני (Shiseido, KOSE, Kanebo) ופטור ממס. 4 דקות מתחנת Namba.',
          shinsaibashiGuide,
          'Matsumoto Kiyoshi Shinsaibashi South 2-5-5 Shinsaibashisuji Osaka',
        ),
        listing('LIVE JAPAN', shinsaibashiGuide),
      ),
      checked(
        pick(
          'Sakai Ichimonji Mitsuhide (Doguyasuji)',
          'סכינים יפניים למטבח',
          'ב׳–ו׳ 9:30–18:30; סופ״ש וחגים 10:30–18:30',
          `הכי מומלצת לסכינים: מעל 2,000 סוגי סכינים מסאקאי, עיר הסכינים של יפן, ברחוב כלי המטבח Doguyasuji — הליכה קצרה מהמלון בנמבה. צוות דובר אנגלית. ${KNIFE_LUGGAGE}`,
          'https://global.ichimonji.co.jp/pages/store-guide',
          'Sakai Ichimonji Mitsuhide 14-8 Nanbasennichimae Osaka',
          true,
        ),
        official('https://global.ichimonji.co.jp/pages/store-guide'),
      ),
      checked(
        pick(
          'Tower Knives Osaka',
          'סכינים יפניים למטבח',
          'כל יום 10:00–18:00 (לפי אתר רשימות)',
          'כ־500 סכינים של נפחים מסאקאי, ליד מגדל Tsutenkaku בשינסקאי (4 דק׳ מתחנת Ebisucho). הצוות מסביר באנגלית ועוזר לבחור, ולפעמים אפשר לראות השחזה.',
          'https://osaka-info.jp/experience/en/osaka/spot/471',
          'Tower Knives Osaka Shinsekai',
        ),
        listing('Osaka Info', 'https://osaka-info.jp/experience/en/osaka/spot/471'),
      ),
    ],
    hours: [
      {
        name: 'Daimaru Shinsaibashi',
        hours: '10:00–20:00',
        note: 'קומות הקניות',
        website: 'https://www.daimaru.co.jp/shinsaibashi-store/e/',
      },
      {
        name: 'Don Quijote Dotonbori',
        hours: '24 שעות',
        note: 'פתוח גם מאוחר בלילה',
        website: 'https://www.donki.com/en/store/shop_detail.php?shop_id=110',
      },
    ],
  },
  {
    date: '2037-11-11',
    city: 'osaka',
    area: 'Shinsaibashi + Umeda',
    focus: 'קניות אחרונות באוסקה, עם עדיפות ל־COPIC ב־Tools Umeda רק אם מסיימות בזמן לרכבת.',
    picks: [
      pick(
        'Tools Osaka Umeda',
        'COPIC / מרקרים / מנגה',
        '10:00–21:00',
        'הזדמנות רשמית נהדרת ל־COPIC, אבל זו סטייה קצרה ואסור להחמיץ את NOZOMI 46 ב־18:30.',
        'https://copic.jp/en/campaign/how-to-buy-copic-in-japan',
        'Tools Osaka Umeda Whity Umeda Osaka',
        true,
      ),
      pick(
        'Shinsaibashi-suji Shopping Arcade',
        'GU / אופנה צעירה',
        'שעות לפי חנות',
        'לסגור קניות קודמות ולעזוב מוקדם יחסית, סביב 16:15 לכל המאוחר.',
        'https://www.google.com/maps/search/?api=1&query=Shinsaibashi+Shopping+Street',
        'Shinsaibashi Shopping Arcade Osaka',
      ),
      pick(
        'UNIQLO Shinsaibashi-suji',
        'בגדים',
        '11:00–21:00',
        'אם לא הספקתן ביום ראשון; לא להוסיף אם יתנגש ברכבת.',
        'https://map.uniqlo.com/jp/ja/detail/10101733',
        'UNIQLO Shinsaibashi-suji Osaka',
      ),
      checked(
        pick(
          '@cosme OSAKA',
          'קוסמטיקה יפנית וקוריאנית',
          'כל יום 10:30–20:30',
          'חנות הדגל של @cosme באוסקה, לפי דירוגי הגולשות. קומה 3 ב־LUCUA ILE ליד תחנת Osaka — קרוב ל־Tools Umeda, אז אפשר לשלב לפני הרכבת.',
          'https://www.cosme.net/store/flagship/osaka/',
          '@cosme OSAKA LUCUA ILE Umeda Osaka',
          true,
        ),
        official('https://www.cosme.net/store/flagship/osaka/'),
      ),
      checked(
        pick(
          'Yodobashi Camera Multimedia Umeda',
          'סיר אורז / מוצרי חשמל / שעונים',
          'כל יום 9:30–22:00 (לפי אתר רשימות)',
          `ממול לתחנת Osaka, ליד Tools Umeda. סירי האורז בקומה 4. ${RICE_COOKER_TIP} סיר אורז הוא קופסה גדולה — כדאי לקנות כאן ביום האחרון באוסקה ולא לסחוב אותו כל הטיול.`,
          'https://www.yodobashi.com/ec/store/0081/',
          'Yodobashi Camera Multimedia Umeda Osaka',
        ),
        listing(
          'Osaka Station guide',
          'https://www.osakastation.com/yodobashi-camera-yodobashi-umeda/',
        ),
      ),
      pokemonCenterOsaka,
    ],
    hours: [
      {
        name: 'Daimaru Shinsaibashi',
        hours: '10:00–20:00',
        note: 'לסיים מוקדם עם מרווח לרכבת NOZOMI 46 שהוזמנה ל־18:30',
        website: 'https://www.daimaru.co.jp/shinsaibashi-store/e/',
      },
      {
        name: 'Shinsaibashi shopping street',
        hours: 'משתנה',
        note: 'לבדוק כל חנות בנפרד',
        website: 'https://www.google.com/maps/search/?api=1&query=Shinsaibashi+shopping+street',
      },
    ],
  },
  {
    date: '2037-11-12',
    city: 'tokyo',
    area: 'Shibuya + Harajuku',
    focus:
      'היום החשוב לבגדים: אופנה צעירה ב־109, מותגים יפניים ב־PARCO, הראג׳וקו ו־Kiddy Land. לא חייבים להספיק הכול.',
    picks: [
      pick(
        'SHIBUYA109',
        'אופנה צעירה יפנית',
        '10:00–21:00',
        'אם אוהבת אופנה מקומית טרנדית, להתחיל כאן. הרבה מותגים ייחודיים יותר מזארה.',
        'https://shibuya109.jp/',
        'SHIBUYA109 2-29-1 Dogenzaka Tokyo',
        true,
      ),
      checked(
        pick(
          '@cosme TOKYO',
          'קוסמטיקה יפנית וקוריאנית',
          'כל יום 11:00–21:00',
          'חנות הקוסמטיקה הגדולה בטוקיו, דקה מתחנת Harajuku: שלוש קומות עם המותגים המדורגים ביותר ב־@cosme, כולל מותגים קוריאניים. בדיוק על המסלול להראג׳וקו.',
          'https://www.cosme.net/store/flagship/tokyo/',
          '@cosme TOKYO 1-14-27 Jingumae Shibuya Tokyo',
          true,
        ),
        official('https://www.cosme.net/store/flagship/tokyo/'),
      ),
      pick(
        'Shibuya PARCO',
        'אופנה יפנית / משחקים / פופ־קאלצ׳ר',
        'חנויות 11:00–21:00; Nintendo/Pokémon מ־10:00',
        'שילוב מוצלח לאופנה, עיצוב ותרבות פופ באותו מקום.',
        'https://shibuya.parco.jp/info/',
        'Shibuya PARCO 15-1 Udagawacho Tokyo',
      ),
      pick(
        'Kiddy Land Harajuku',
        'דמויות / מתנות / Kawaii',
        '11:00–20:00',
        'עצירה אישית מומלצת בהראג׳וקו, במיוחד אם אוהבת מוצרים יפניים מיוחדים.',
        'https://www.kiddyland.co.jp/shoplist/harajuku/',
        'Kiddy Land Harajuku 6-1-9 Jingumae Tokyo',
        true,
      ),
      pick(
        'GU Shibuya',
        'אופנה יפנית נגישה',
        'לפי סניף; לבדוק באתר',
        'GU היא אחות צעירה וזולה יחסית ל־UNIQLO — אופציה גמישה.',
        'https://www.gu-global.com/jp/ja/',
        'GU Shibuya Tokyo',
      ),
      pick(
        'Hands Shibuya Scramble Square',
        'ציור / עטים / נייר',
        '10:00–21:00',
        'חנות נוחה ליד התחנה, כחלופה אם לא מספיקים חנות COPIC ייעודית.',
        'https://store.hands.net/shibuya-sq/',
        'Hands Shibuya Scramble Square',
      ),
      pick(
        'Takeshita Street',
        'חנויות עצמאיות / אופנת רחוב',
        'שונה מחנות לחנות',
        'סיבוב אופנה צעירה בהראג׳וקו. לא חייבים לקנות בחנויות בינלאומיות שאפשר למצוא בכל מקום.',
        'https://www.gotokyo.org/en/spot/48/index.html',
        'Takeshita Street Harajuku Tokyo',
      ),
      pokemonCenterShibuya,
    ],
    hours: [
      {
        name: 'SHIBUYA109',
        hours: '10:00–21:00',
        note: 'אופנה וביוטי',
        website: 'https://shibuya109.jp/',
      },
      {
        name: 'Shibuya PARCO',
        hours: '11:00–21:00',
        note: 'קומה 6 (Nintendo/Pokémon): 10:00–21:00',
        website: 'https://shibuya.parco.jp/shop/',
      },
      {
        name: 'Kiddy Land Harajuku',
        hours: '11:00–20:00',
        note: 'לבדוק חריגים',
        website: 'https://www.kiddyland.co.jp/harajuku/',
      },
    ],
  },
  {
    date: '2037-11-13',
    city: 'tokyo',
    area: 'Shinjuku + Nakano',
    focus: 'לציור מקצועי: Sekaido ליד שינג׳וקו. זהו יום שישי ולכן להשאיר מרווח לחב״ד.',
    picks: [
      pick(
        'Sekaido Shinjuku',
        'ציור / מנגה / מרקרים',
        '09:30–20:00',
        'המלצה חזקה במיוחד לציוד ציור מקצועי לצד מנגה, קרוב לשינג׳וקו גיואן. לבצע עצירה קצרה בגלל שבת.',
        'https://www.sekaido.co.jp/',
        'Sekaido Shinjuku 3-1-1 Shinjuku Tokyo',
        true,
      ),
      pick(
        'Nakano Broadway',
        'מנגה / חנויות קומיקס',
        'שעות משתנות לפי חנות',
        'אפשרות להשלמות בלבד, כי כבר מתוכנן ביקור ב־5.11. לא לסכן את זמן החזרה לחב״ד.',
        'https://www.gotokyo.org/en/spot/72/index.html',
        'Nakano Broadway Tokyo',
      ),
      mandarakeCards,
      checked(
        pick(
          'Shin-Okubo · SKINGARDEN ועוד',
          'טיפוח קוריאני',
          'רוב החנויות בערך 10:00–21:00/22:00',
          'רובע קוריאה של טוקיו, תחנה אחת מ־Shinjuku בקו Yamanote. SKINGARDEN (קומה 2 ב־K-PLAZA II) מהגדולות, ויש גם Myungdong Cosme, STARBOX ו־dasique. יום שישי — לשמור את זה קצר.',
          'https://jw-webmagazine.com/tips/best-korean-beauty-stores-in-shin-okubo/',
          'SKINGARDEN Shin-Okubo 2-1-2 Hyakunincho Shinjuku Tokyo',
        ),
        listing(
          'JW Web Magazine (ספט׳ 2025)',
          'https://jw-webmagazine.com/tips/best-korean-beauty-stores-in-shin-okubo/',
        ),
      ),
      yodobashiShinjuku,
    ],
    hours: [
      {
        name: 'Nakano Broadway',
        hours: '10:00–20:00',
        note: 'שעות שונות לחנויות; לא לדחות הכנות שבת',
        website: 'https://www.gotokyo.org/en/spot/72/index.html',
      },
      {
        name: 'Shinjuku Gyoen',
        hours: '09:00–16:30',
        note: '1–15.11: כניסה אחרונה ב־16:00; תערוכת חרציות',
        website: 'https://www.env.go.jp/en/press/press_02866.html',
      },
    ],
  },
  {
    date: '2037-11-15',
    city: 'tokyo',
    area: 'Shibuya',
    focus: 'קניות אחרונות בשיבויה — המזוודות כבר נשלחו, ומכאן ישר לתחנת Tokyo ולמלון בדיסני.',
    picks: [
      pick(
        'Shibuya Center-gai',
        'חנויות צעירות / מזכרות',
        'לפי חנות',
        'סיבוב עד 16:15, לפני הרכבת לתחנת Tokyo והמעבר לשין־אוריאסו.',
        'https://www.google.com/maps/search/?api=1&query=Shibuya+Center+gai',
        'Shibuya Center-gai Tokyo',
        true,
      ),
      pick(
        'Hands Shibuya Scramble Square',
        'כלי כתיבה / יצירה',
        '10:00–21:00',
        'אם תרצי ציוד ציור ביום האחרון בעיר, קרוב לתחנת Shibuya ובדרך לרכבת.',
        'https://store.hands.net/shibuya-sq/',
        'Hands Shibuya Scramble Square',
      ),
      pick(
        'UNIQLO / GU באזור שיבויה',
        'בגדים',
        'לבדוק סניף ספציפי',
        'השלמות אופנה בלבד, לא במקום המעבר למלון של דיסני.',
        'https://www.uniqlo.com/jp/ja/',
        'UNIQLO Shibuya Tokyo',
      ),
      checked(
        pick(
          'Shibuya LOFT',
          'קוסמטיקה / כלי כתיבה',
          'כל יום 11:00–21:00',
          'קומת קוסמטיקה גדולה עם מותגים יפניים וקוריאניים במחירי פארם, ועוד קומות של כלי כתיבה ומתנות.',
          'https://www.gotokyo.org/en/spot/445/index.html',
          'Shibuya LOFT 21-1 Udagawacho Tokyo',
        ),
        listing('GO TOKYO', 'https://www.gotokyo.org/en/spot/445/index.html'),
      ),
      pokemonCenterShibuya,
    ],
    hours: [
      {
        name: 'SHIBUYA109',
        hours: '10:00–21:00',
        note: 'קניות אם נשאר זמן לפני מעבר המלון',
        website: 'https://shibuya109.jp/',
      },
      {
        name: 'Shibuya PARCO',
        hours: '11:00–21:00',
        note: 'קומה 6: 10:00–21:00',
        website: 'https://shibuya.parco.jp/shop/',
      },
    ],
  },
];

/** Outside lists for more shops. */
export const shoppingLinks: MoreLink[] = [
  {
    label: '@cosme · כל החנויות',
    note: 'חנויות הדגל בטוקיו ובאוסקה ושאר הסניפים',
    url: 'https://www.cosme.net/store/sitemap/',
  },
  {
    label: 'K-beauty ב־Shin-Okubo',
    note: 'עשר חנויות טיפוח קוריאני, עם שעות ובמה כל אחת טובה',
    url: 'https://jw-webmagazine.com/tips/best-korean-beauty-stores-in-shin-okubo/',
  },
  {
    label: 'איפה לקנות קלפי פוקימון בטוקיו',
    note: 'Akihabara (Hareruya 2), Nakano, Ikebukuro ו־Pokémon Centers',
    url: 'https://metropolisjapan.com/where-to-buy-pokemon-cards-in-tokyo/',
  },
  {
    label: 'קניות בשינסאיבאשי',
    note: 'פארמים, קוסמטיקה ואופנה על המדרחוב, עם קופונים',
    url: shinsaibashiGuide,
  },
  {
    label: 'סירי אורז לחו״ל ב־Yodobashi',
    note: 'דגמי 220–230V של Zojirushi ו־Tiger עם תפריט באנגלית (מחירים מ־2019)',
    url: riceCookerGuide,
  },
  {
    label: 'Doguyasuji, רחוב כלי המטבח של אוסקה',
    note: 'כ־50 חנויות סכינים וכלי מטבח בנמבה',
    url: 'https://metronine.osaka/en/article_tour/osaka-is-kitchen-street/',
  },
];

export function shoppingFor(date: string): ShoppingDay | undefined {
  return shoppingDays.find((day) => day.date === date);
}
