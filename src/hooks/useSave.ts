import { useTranslation } from 'react-i18next';
import { useToast } from '../app/toastContext';
import { errorReason } from '../lib/liveEdit';

/**
 * Runs a live save and says why it failed; a wrong code asks for the code again. With `done`, a
 * save that worked says so too.
 */
export function useSave(onLocked: () => void) {
  const { t } = useTranslation();
  const toast = useToast();
  return async (save: () => Promise<void>, done?: string): Promise<boolean> => {
    try {
      await save();
      if (done) toast(done);
      return true;
    } catch (failure) {
      const reason = errorReason(failure);
      if (reason === 'wrong') onLocked();
      toast(t(`live.errors.${reason}`));
      return false;
    }
  };
}

/** What `useSave` gives: run a save, and get whether it worked. */
export type Save = ReturnType<typeof useSave>;
