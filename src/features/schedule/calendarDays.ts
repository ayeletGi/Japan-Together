import type { CityId } from '../../data/cities';
import type { Language } from '../../i18n';

export type CellIcon =
  'plane' | 'art' | 'train' | 'park' | 'moon' | 'kimono' | 'game' | 'shop' | 'castle';

type Text = Record<Language, string>;

/**
 * One calendar cell: the day's main thing, at most two extra lines where the day really has more
 * (free hours for shopping, the spa), and the city it happens in. A cell whose city differs from
 * the city we sleep in is a day trip and says where ("בקיוטו").
 */
export interface CalendarDay {
  icon: CellIcon;
  city: CityId;
  main: Text;
  extra?: Text[];
}

const t = (he: string, en: string): Text => ({ he, en });

export const calendarDays: Record<string, CalendarDay> = {
  '2037-11-02': { icon: 'plane', city: 'flight', main: t('טיסה', 'Flight') },
  '2037-11-03': { icon: 'plane', city: 'tokyo', main: t('נחיתה', 'Landing') },
  '2037-11-04': {
    icon: 'art',
    city: 'tokyo',
    main: t('teamLab', 'teamLab'),
    extra: [t('קניות בגינזה', 'Ginza shopping')],
  },
  '2037-11-05': {
    icon: 'train',
    city: 'kobe',
    main: t('מעבר מלון', 'Hotel move'),
    extra: [t('קניות בנקאנו', 'Nakano shopping')],
  },
  '2037-11-06': { icon: 'park', city: 'kobe', main: t('גני Nunobiki', 'Nunobiki gardens') },
  '2037-11-07': { icon: 'moon', city: 'kobe', main: t('שבת', 'Shabbat') },
  '2037-11-08': {
    icon: 'train',
    city: 'osaka',
    main: t('מעבר מלון', 'Hotel move'),
    extra: [t('קניות בדוטונבורי', 'Dotonbori shopping')],
  },
  '2037-11-09': {
    icon: 'kimono',
    city: 'kyoto',
    main: t('קימונו', 'Kimono'),
    extra: [t('UZU Kyoto בערב', 'UZU Kyoto dinner')],
  },
  '2037-11-10': { icon: 'game', city: 'osaka', main: t('יוניברסל', 'Universal') },
  '2037-11-11': {
    icon: 'train',
    city: 'tokyo',
    main: t('מעבר מלון', 'Hotel move'),
    extra: [t('קניות אחרונות', 'Last shopping')],
  },
  '2037-11-12': {
    icon: 'shop',
    city: 'tokyo',
    main: t('שיבויה', 'Shibuya'),
    extra: [t('קניות בהראג׳וקו', 'Harajuku shopping'), t('ספא ראש', 'Head spa')],
  },
  '2037-11-13': {
    icon: 'park',
    city: 'tokyo',
    main: t('גן שינג׳וקו', 'Shinjuku garden'),
    extra: [t('קניות בנקאנו', 'Nakano shopping')],
  },
  '2037-11-14': { icon: 'moon', city: 'tokyo', main: t('שבת', 'Shabbat') },
  '2037-11-15': {
    icon: 'train',
    city: 'disney',
    main: t('מעבר מלון', 'Hotel move'),
    extra: [t('קניות בשיבויה', 'Shibuya shopping')],
  },
  '2037-11-16': { icon: 'castle', city: 'disney', main: t('Disneyland', 'Disneyland') },
  '2037-11-17': { icon: 'castle', city: 'disney', main: t('DisneySea', 'DisneySea') },
  '2037-11-18': { icon: 'plane', city: 'flight', main: t('טיסה הביתה', 'Flight home') },
};
