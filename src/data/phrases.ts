import type { Bilingual } from './types';

/** A phrase to show someone: what it means, how to say it, and the Japanese to show. */
export interface Phrase {
  id: string;
  meaning: Bilingual;
  /** How to say it: Hebrew letters for Hebrew, rōmaji for English. */
  reading: Bilingual;
  ja: string;
}

export const phrases: Phrase[] = [
  {
    id: 'thanks',
    meaning: { he: 'תודה רבה', en: 'Thank you very much' },
    reading: { he: 'אָרִיגָטוֹ גוֹזָאִימָס', en: 'arigatō gozaimasu' },
    ja: 'ありがとうございます',
  },
  {
    id: 'sorry',
    meaning: { he: 'סליחה', en: 'Excuse me' },
    reading: { he: 'סוּמִימָסֶן', en: 'sumimasen' },
    ja: 'すみません',
  },
  {
    id: 'vegan',
    meaning: { he: 'אנחנו טבעוניות', en: 'We are vegan' },
    reading: { he: 'בִּיגָן דֶס', en: 'bīgan desu' },
    ja: 'ビーガンです',
  },
  {
    id: 'noDashi',
    meaning: {
      he: 'אנחנו לא אוכלות בשר, דגים, ביצים, חלב — וגם לא דאשי (ציר דגים)',
      en: 'We don’t eat meat, fish, eggs or dairy — and no dashi (fish stock) either',
    },
    reading: {
      he: 'נִיקוּ, סָקָנָה, טָמָגוֹ, נְיוּסֵיהִין, סָקָנָה נוֹ דָאשִׁי וָה טָבֶּרָרֶמָסֶן',
      en: 'niku, sakana, tamago, nyūseihin, sakana no dashi wa taberaremasen',
    },
    ja: '肉・魚・卵・乳製品、魚のだしも食べられません',
  },
  {
    id: 'dashi',
    meaning: { he: 'יש בזה דאשי (ציר דגים)?', en: 'Is there dashi (fish stock) in this?' },
    reading: {
      he: 'קוֹרֶה נִי דָאשִׁי וָה הָאִיטֶה אִימָס קָה?',
      en: 'kore ni dashi wa haitte imasu ka?',
    },
    ja: 'これにだしは入っていますか？',
  },
  {
    id: 'toilet',
    meaning: { he: 'איפה השירותים?', en: 'Where is the toilet?' },
    reading: { he: 'טוֹאִירֶה וָה דוֹקוֹ דֶס קָה?', en: 'toire wa doko desu ka?' },
    ja: 'トイレはどこですか？',
  },
  {
    id: 'price',
    meaning: { he: 'כמה זה עולה?', en: 'How much is this?' },
    reading: { he: 'קוֹרֶה וָה אִיקוּרָה דֶס קָה?', en: 'kore wa ikura desu ka?' },
    ja: 'これはいくらですか？',
  },
  {
    id: 'card',
    meaning: { he: 'אפשר לשלם בכרטיס?', en: 'Can I pay by card?' },
    reading: { he: 'קָאדוֹ וָה צוּקָאֶמָס קָה?', en: 'kādo wa tsukaemasu ka?' },
    ja: 'カードは使えますか？',
  },
  {
    id: 'hotel',
    meaning: { he: 'למלון הזה, בבקשה', en: 'To this hotel, please' },
    reading: {
      he: 'קוֹנוֹ הוֹטֶרוּ מָדֶה אוֹנֶגָאִי שִׁימָס',
      en: 'kono hoteru made onegai shimasu',
    },
    ja: 'このホテルまでお願いします',
  },
];

export const phraseById = (id: string) => phrases.find((phrase) => phrase.id === id);
