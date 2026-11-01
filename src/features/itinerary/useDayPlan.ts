import { useCallback, useMemo } from 'react';
import { getDay } from '../../data/trip';
import { useLocalState } from '../../hooks/useLocalState';
import { applyPlanEdits, NO_EDITS, type DayEdits, type PlanEdits } from './planEdits';

const NONE: PlanEdits = {};

/** Every day's edits on this phone. */
export const usePlanEdits = () => useLocalState<PlanEdits>('planEdits', NONE);

/**
 * A day's stops with this phone's edits applied, and the ways to change them. Every screen and
 * sheet using the same date sees the same edits.
 */
export function useDayPlan(date: string) {
  const [all, setAll] = usePlanEdits();
  const day = getDay(date)!;
  const edits = all[date] ?? NO_EDITS;
  const stops = useMemo(() => applyPlanEdits(day, edits), [day, edits]);

  const update = useCallback(
    (change: (edits: DayEdits) => DayEdits) =>
      setAll((current) => ({ ...current, [date]: change(current[date] ?? NO_EDITS) })),
    [setAll, date],
  );

  const reset = useCallback(
    () =>
      setAll((current) => {
        const rest = { ...current };
        delete rest[date];
        return rest;
      }),
    [setAll, date],
  );

  return { day, stops, edits, update, reset };
}
