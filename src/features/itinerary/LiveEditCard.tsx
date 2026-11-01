import { ChevronDown, ChevronUp, LockKeyhole, Undo2, X } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../app/toastContext';
import { IconTile } from '../../components/IconTile';
import { useLiveVersion } from '../../data/live';
import { getDay } from '../../data/trip';
import { useContentProps } from '../../i18n';
import {
  errorReason,
  eventForm,
  forgetCode,
  mergeEventChange,
  saveEventChange,
  saveEventChanges,
  savedCode,
  swapTimes,
  undoLastChange,
  unlock,
  type EventForm,
} from '../../lib/liveEdit';
import { eventDisplay } from './eventDisplay';
import { StopTime } from './PlanRow';
import { stopIcon, stopTone } from './stopLook';
import { baseStops, type PlanStop } from './stops';
import './live-edit.css';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="live-field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <small className="muted">{hint}</small>}
    </div>
  );
}

/** Asks for the personal code once per phone. */
export function UnlockForm({ onUnlocked }: { onUnlocked: () => void }) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="live-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await unlock(code);
          onUnlocked();
        } catch (failure) {
          setError(t(`live.errors.${errorReason(failure)}`));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="live-intro">
        <LockKeyhole size={18} aria-hidden="true" />
        {t('live.locked')}
      </p>
      <Field label={t('live.code')} hint={t('live.codeHint')}>
        {(id) => (
          <input
            id={id}
            className="input live-code"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={12}
            dir="ltr"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoFocus
            required
          />
        )}
      </Field>
      {error && (
        <p className="live-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
        {t('live.unlock')}
      </button>
    </form>
  );
}

type Run = (action: () => Promise<void>, done: string, after?: () => void) => Promise<void>;

/**
 * The activity's fields. Until something is typed, it follows the saved values (a change from the
 * other phone shows up); once something is typed, a refresh never wipes it.
 */
function EditForm({
  stop,
  busy,
  run,
  onClose,
}: {
  stop: PlanStop;
  busy: boolean;
  run: Run;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const content = useContentProps();
  const event = stop.event!;
  const fresh = eventForm(event, eventDisplay(event));
  const [state, setState] = useState({ before: fresh, form: fresh, typed: false });
  if (!state.typed && JSON.stringify(state.before) !== JSON.stringify(fresh)) {
    setState({ before: fresh, form: fresh, typed: false });
  }
  const { before, form } = state;
  const [unchanged, setUnchanged] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const set = (field: keyof EventForm, value: string) => {
    setUnchanged(false);
    setState({ before, form: { ...form, [field]: value }, typed: true });
  };
  const text = (field: keyof EventForm, label: string, hint?: string, long = false) => (
    <Field label={label} hint={hint}>
      {(id) =>
        long ? (
          <textarea
            id={id}
            className="input"
            rows={3}
            value={form[field]}
            onChange={(e) => set(field, e.target.value)}
            {...content}
          />
        ) : (
          <input
            id={id}
            className="input"
            value={form[field]}
            onChange={(e) => set(field, e.target.value)}
            {...content}
          />
        )
      }
    </Field>
  );
  const clock = (field: 'time' | 'end', label: string) => (
    <Field label={label}>
      {(id) => (
        <input
          id={id}
          type="time"
          className="input live-clock"
          dir="ltr"
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
        />
      )}
    </Field>
  );

  return (
    <form
      className="live-form"
      onSubmit={(submit) => {
        submit.preventDefault();
        const change = mergeEventChange(before, form);
        if (!change) setUnchanged(true);
        else void run(() => saveEventChange(event.id, change), t('live.saved'), onClose);
      }}
    >
      {text('displayTitle', t('live.fields.displayTitle'))}
      {text('displayDescription', t('live.fields.displayDescription'), undefined, true)}
      <div className="live-times">
        {clock('time', t('live.fields.time'))}
        {clock('end', t('live.fields.end'))}
      </div>
      <small className="muted live-times-hint">{t('live.noTime')}</small>
      <details className="live-more">
        <summary>{t('live.more')}</summary>
        {text('place', t('live.fields.place'), t('live.placeHint'))}
        {text('title', t('live.fields.title'))}
        {text('note', t('live.fields.note'), undefined, true)}
      </details>
      {unchanged && (
        <p className="live-error" role="alert">
          {t('live.nothingChanged')}
        </p>
      )}
      <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
        {t('live.save')}
      </button>
      {confirmRemove ? (
        <div className="live-confirm" role="group" aria-label={t('live.remove')}>
          <button
            type="button"
            className="btn btn--danger btn--wide"
            disabled={busy}
            autoFocus
            onClick={() =>
              void run(
                () => saveEventChange(event.id, { removed: true }),
                t('live.removed'),
                onClose,
              )
            }
          >
            {t('live.confirmRemove')}
          </button>
          <button type="button" className="btn btn--wide" onClick={() => setConfirmRemove(false)}>
            {t('live.keep')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--danger btn--wide"
          disabled={busy}
          onClick={() => setConfirmRemove(true)}
        >
          <X size={16} aria-hidden="true" />
          {t('live.remove')}
        </button>
      )}
    </form>
  );
}

/**
 * ✏️ One stop of the day, opened for editing in place: move it up or down, change its card,
 * time and details, or take it out. Changes go to the live database (`src/data/live.ts`), so
 * both phones see them. Needs the personal code once per phone.
 */
export function LiveEditCard({ stop, onClose }: { stop: PlanStop; onClose: () => void }) {
  const { t } = useTranslation();
  const content = useContentProps();
  const toast = useToast();
  // Redraws with every new copy, so moving uses the latest shared times.
  useLiveVersion();
  const [unlocked, setUnlocked] = useState(() => !!savedCode());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = stopIcon(stop);

  const run: Run = async (action, done, after) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      toast(done);
      after?.();
    } catch (failure) {
      const reason = errorReason(failure);
      if (reason === 'wrong') setUnlocked(false);
      setError(t(`live.errors.${reason}`));
    } finally {
      setBusy(false);
    }
  };

  const move = (direction: -1 | 1) => {
    // The shared plan's times, without this phone's own old edits.
    const day = getDay(stop.date);
    const changes = day && swapTimes(baseStops(day), stop.id, direction);
    if (!changes) toast(t(direction < 0 ? 'edit.first' : 'edit.last'));
    else void run(() => saveEventChanges(changes), t('live.moved'));
  };

  return (
    <li className="plan-row is-live-editing">
      <IconTile tone={stopTone(stop)}>
        <Icon size={22} strokeWidth={1.8} />
      </IconTile>
      <div className="plan-box live-card" role="group" aria-label={t('live.title')}>
        <div className="live-card-head">
          <div className="live-card-heading">
            <bdi className="plan-title" {...content}>
              {stop.title}
            </bdi>
            <span className="plan-meta muted">
              <StopTime stop={stop} />
            </span>
          </div>
          <button
            type="button"
            className="round-button live-close"
            onClick={onClose}
            aria-label={t('live.close')}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {!unlocked ? (
          <UnlockForm onUnlocked={() => setUnlocked(true)} />
        ) : (
          <>
            {stop.pinned ? (
              <p className="small-note live-pinned">{t('live.pinned')}</p>
            ) : (
              <div className="live-move" role="group" aria-label={t('live.move')}>
                <span>{t('live.move')}</span>
                <button
                  type="button"
                  className="mini-button"
                  disabled={busy}
                  onClick={() => move(-1)}
                  aria-label={t('live.up')}
                >
                  <ChevronUp size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="mini-button"
                  disabled={busy}
                  onClick={() => move(1)}
                  aria-label={t('live.down')}
                >
                  <ChevronDown size={20} aria-hidden="true" />
                </button>
              </div>
            )}
            {error && (
              <p className="live-error" role="alert">
                {error}
              </p>
            )}
            <EditForm stop={stop} busy={busy} run={run} onClose={onClose} />
            <div className="live-footer">
              <button
                type="button"
                className="btn btn--small live-undo"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => undoLastChange({ kind: 'events', key: stop.event!.id }),
                    t('live.undone'),
                  )
                }
              >
                <Undo2 size={15} aria-hidden="true" />
                {t('live.undo')}
              </button>
              <button
                type="button"
                className="text-link live-lock"
                onClick={() => {
                  forgetCode();
                  setUnlocked(false);
                }}
              >
                {t('live.lock')}
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
