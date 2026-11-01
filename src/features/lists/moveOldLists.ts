import { MAX_ENTRIES } from '../../../shared/liveSchema';
import { liveChanges } from '../../data/live';
import { saveListEntries, savedCode, whoAmI } from '../../lib/liveEdit';
import { loadJson, removeJson } from '../../lib/storage';
import { GIFT_LIST, oldGifts, oldTicks, type OldGift } from './lists';

/** Where this phone kept the checklist ticks and the gift list before the lists were shared. */
const OLD_TICKS_KEY = 'checklist';
const OLD_GIFTS_KEY = 'gifts';

/** Gifts this phone still keeps on its own, not moved to a shared list yet. */
export const giftsOnThisPhone = (): OldGift[] => loadJson<OldGift[]>(OLD_GIFTS_KEY) ?? [];

let moving = false;

/**
 * Once a phone has a code: saves the ticks and gifts it kept on its own into the shared lists
 * (gifts go to that person's gift list), then forgets the local copies, only once all are saved.
 */
export async function moveOldLists(): Promise<void> {
  const ticks = loadJson<string[]>(OLD_TICKS_KEY) ?? [];
  const gifts = giftsOnThisPhone();
  if (moving || !savedCode() || (!ticks.length && !gifts.length)) return;
  moving = true;
  try {
    const who = await whoAmI();
    const giftList = who ? GIFT_LIST[who] : undefined;
    const entries = Object.entries({
      ...oldTicks(liveChanges(), ticks),
      ...(giftList ? oldGifts(liveChanges(), giftList, gifts) : {}),
    });
    for (let start = 0; start < entries.length; start += MAX_ENTRIES) {
      await saveListEntries(
        'listItems',
        Object.fromEntries(entries.slice(start, start + MAX_ENTRIES)),
      );
    }
    removeJson(OLD_TICKS_KEY);
    if (giftList) removeJson(OLD_GIFTS_KEY);
  } catch {
    // Offline or a wrong code: try again next time.
  } finally {
    moving = false;
  }
}
