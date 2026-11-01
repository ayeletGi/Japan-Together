import { MapPin, Plus, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from '../../app/router';
import { useSheet } from '../../app/sheetContext';
import { useToast } from '../../app/toastContext';
import { SectionTitle } from '../../components/SectionTitle';
import { useYenRate } from '../yen/rate';
import { LiveEditCard } from './LiveEditCard';
import { hasEdits } from './planEdits';
import { PlanRow } from './PlanRow';
import { stopState } from './progress';
import { useDayPlan } from './useDayPlan';
import './plan-edit.css';

/**
 * "The day's plan": the timeline of stops, each with its stamp (inked once the cat reaches it), and
 * past / now / next states as the day goes. Each stop of the plan has its own ✏️, which opens it
 * for editing in place (for both of us).
 */
export function DayPlan({
  date,
  now,
  reached,
  onStamp,
}: {
  date: string;
  /** Minutes on the day's clock, or null when the day is not being lived right now. */
  now: number | null;
  /** How many stops the cat has reached; those are stamped. */
  reached: number;
  /** Before the trip: tapping a stop's stamp collects it (and every stamp before it). */
  onStamp?: (index: number) => void;
}) {
  const { t } = useTranslation();
  const { open } = useSheet();
  const toast = useToast();
  const { stops, edits, reset } = useDayPlan(date);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { rate } = useYenRate();

  return (
    <section className="day-plan" aria-labelledby="plan-title">
      <SectionTitle
        id="plan-title"
        action={
          <span className="row">
            <button
              type="button"
              className="btn btn--small"
              onClick={() => open({ kind: 'export', date })}
            >
              <Share2 size={16} aria-hidden="true" />
              {t('export.button')}
            </button>
            <a className="btn btn--small" href={paths.route(date)}>
              <MapPin size={16} aria-hidden="true" />
              {t('plan.route')}
            </a>
          </span>
        }
      >
        {t('plan.title')}
      </SectionTitle>
      <ol className="plan-list">
        {stops.map((stop, index) =>
          stop.id === editingId && stop.event && !stop.pinned ? (
            <LiveEditCard key={stop.id} stop={stop} onClose={() => setEditingId(null)} />
          ) : (
            <PlanRow
              key={stop.id}
              stop={stop}
              ilsPerJpy={rate.ilsPerJpy}
              stamped={index < reached}
              onStamp={onStamp && (() => onStamp(index))}
              state={now === null ? null : stopState(stops, index, now)}
              onOpen={() => open({ kind: 'stop', date, stopId: stop.id })}
              // 📌 stops are fixed: no ✏️, so their time and details can't be edited.
              onEdit={stop.event && !stop.pinned ? () => setEditingId(stop.id) : undefined}
            />
          ),
        )}
      </ol>
      <div className="row plan-edit-footer">
        <button type="button" className="btn" onClick={() => open({ kind: 'add', date })}>
          <Plus size={18} aria-hidden="true" />
          {t('edit.add')}
        </button>
        {hasEdits(edits) && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              reset();
              toast(t('edit.resetDone'));
            }}
          >
            {t('edit.reset')}
          </button>
        )}
      </div>
    </section>
  );
}
