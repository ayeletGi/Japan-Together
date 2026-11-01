import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { useToast } from '../../app/toastContext';
import { Sheet, SheetHeader } from '../../components/Sheet';
import type { TripEvent } from '../../data/types';
import { placeName, useLanguage } from '../../i18n';
import { formatDayMonth } from '../../lib/dates';
import { errorReason, saveAddedEvent, savedCode } from '../../lib/liveEdit';
import { formatClock } from '../../lib/time';
import { CustomStopForm } from './CustomStopForm';
import { UnlockForm } from './LiveEditCard';
import type { CustomStop } from './planEdits';
import { SuggestionList } from './SuggestionList';
import { daySuggestions } from './suggestions';
import { useDayPlan } from './useDayPlan';

/** New stops default to an hour after the last one, never past 23:00. */
const LATEST_DEFAULT = 23 * 60;
const NOON = 12 * 60;

const newId = () => `live-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Add an activity at a chosen time: a Discover pick for the day or something of our own. It goes
 * to the live database (`added`), so both phones see it; that needs the personal code once.
 */
export function AddStopSheet({ date }: { date: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const { close } = useSheet();
  const toast = useToast();
  const timeId = useId();
  const { day, stops } = useDayPlan(date);
  const last = stops.at(-1);
  const [time, setTime] = useState(() =>
    formatClock(Math.min(LATEST_DEFAULT, last ? last.minutes + 60 : NOON)),
  );
  const [unlocked, setUnlocked] = useState(() => !!savedCode());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (custom: CustomStop) => {
    const event: TripEvent = {
      id: newId(),
      title: custom.title,
      time,
      end: null,
      date,
      city: day.city,
      status: 'planned',
      kind: custom.kind,
      place: custom.title,
      note: custom.note,
      source: 'live',
      priority: false,
      special: null,
    };
    setBusy(true);
    setError(null);
    try {
      await saveAddedEvent(event);
      close();
      toast(t('edit.added'));
    } catch (failure) {
      const reason = errorReason(failure);
      if (reason === 'wrong') setUnlocked(false);
      setError(t(`live.errors.${reason}`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet label={t('edit.add')} onClose={close}>
      <SheetHeader
        kicker={
          <>
            <bdi>{formatDayMonth(date, lang)}</bdi> · <bdi>{placeName(day.city, t)}</bdi>
          </>
        }
        title={t('edit.add')}
        onClose={close}
      />
      <div className="sheet-body">
        {!unlocked ? (
          <UnlockForm onUnlocked={() => setUnlocked(true)} />
        ) : (
          <fieldset className="add-stop" disabled={busy}>
            <label className="muted add-time" htmlFor={timeId}>
              {t('edit.when')}
              <input
                id={timeId}
                className="input num"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value || time)}
              />
            </label>
            {error && (
              <p className="live-error" role="alert">
                {error}
              </p>
            )}
            <SuggestionList
              suggestions={daySuggestions(date, stops)}
              onPick={({ title, note, kind }) => void add({ title, note, kind })}
            />
            <CustomStopForm
              submitLabel={t('edit.addToPlan')}
              onSubmit={(title) => void add({ title, note: t('edit.addedByUs'), kind: 'activity' })}
            />
          </fieldset>
        )}
      </div>
    </Sheet>
  );
}
