import {
  BedDouble,
  BookOpen,
  Building2,
  Bus,
  CableCar,
  Castle,
  Coffee,
  Croissant,
  Dumbbell,
  FerrisWheel,
  Fish,
  Flame,
  Flower2,
  Gamepad2,
  Landmark,
  Luggage,
  Palette,
  PenTool,
  PlaneLanding,
  PlaneTakeoff,
  Popcorn,
  Rabbit,
  Salad,
  Sandwich,
  Ship,
  ShoppingBag,
  Soup,
  Sparkles,
  TrainFront,
  Trees,
  WandSparkles,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react';
import { KimonoIcon } from '../../components/icons';
import type { TripEvent } from '../../data/types';
import { categoryIcons, eventCategory } from './eventDisplay';

/** First match wins; the title is tried before the place. More specific rules come first. */
const RULES: [RegExp, LucideIcon][] = [
  [/נחיתה|landing/i, PlaneLanding],
  [/LY9\d|טיסה/, PlaneTakeoff],
  [/שאטל|shuttle|יציאה ממלון/i, Bus],
  [/picnic|שהכנתן/, Sandwich],
  [/כביסה|laundry/i, WashingMachine],
  [/מזוודות|luggage|צ׳ק־אאוט/i, Luggage],
  [/harry potter/i, WandSparkles],
  [/nintendo|mario/i, Gamepad2],
  [/minion|dinosaur|mine cart/i, Popcorn],
  [/universal/i, FerrisWheel],
  [/disneysea/i, Ship],
  [/disneyland/i, Castle],
  [/teamlab/i, Sparkles],
  [/kimono/i, KimonoIcon],
  [/ropeway|רכבל/i, CableCar],
  [/garden|gyoen|גן יפני/i, Flower2],
  [/head spa/i, Sparkles],
  [/shibuya sky/i, Building2],
  [/kiddy land/i, Rabbit],
  [/itoya|sekaido|copic|tools osaka/i, PenTool],
  [/nakano|manga|מנגה|אנימה/i, BookOpen],
  [/ramen|tantan|mapo|soup/i, Soup],
  [/sushi/i, Fish],
  [/bread|komeda|cafe|בוקר/i, Croissant],
  [/burger/i, Sandwich],
  [/coffee/i, Coffee],
  [/שבת|shabbat|chabad|חב״ד/i, Flame],
  [/ארוחת|צהריים|lunch|dinner/i, Salad],
  [/גיון|gion|hanamikoji/i, Landmark],
  [/gym|אימון/i, Dumbbell],
  [/shinkansen|שינקנסן|nozomi|express|רכבת|station|תחנת/i, TrainFront],
  [/דוטונבורי|dotonbori|shinsaibashi|shibuya|ginza|harajuku|קניות|109|parco|שווקים/i, ShoppingBag],
];

const CATEGORY_FALLBACK: Partial<Record<ReturnType<typeof eventCategory>, LucideIcon>> = {
  hotel: BedDouble,
  food: Salad,
  shop: Palette,
  activity: Trees,
};

/** A small illustration-style icon for the thing itself (a bowl for ramen, a castle for Disneyland). */
export function attractionIcon(event: TripEvent): LucideIcon {
  for (const text of [event.title, event.place]) {
    for (const [pattern, icon] of RULES) if (pattern.test(text)) return icon;
  }
  const category = eventCategory(event);
  return CATEGORY_FALLBACK[category] ?? categoryIcons[category];
}
