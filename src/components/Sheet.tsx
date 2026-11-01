import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './Sheet.css';

const FOCUSABLE = 'a[href], button:not(:disabled), input, select, textarea, [tabindex="0"]';

/**
 * A bottom sheet on phones and a centred dialog on desktop. Focus moves into it, Tab stays inside,
 * Escape and a tap on the backdrop close it. The opener gets focus back (see `SheetHost`).
 */
export function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const root = panel.current;
    const first = root?.querySelector<HTMLElement>('[data-autofocus]') ?? root;
    first?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const [head, tail] = [items[0], items[items.length - 1]];
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault();
        tail.focus();
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault();
        head.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('sheet-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('sheet-open');
    };
  }, []);

  return (
    <div
      className="sheet-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        ref={panel}
        tabIndex={-1}
      >
        <div className="sheet-grab" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

/** The top row of a sheet: an optional icon tile, a small line above the title, and close. */
export function SheetHeader({
  icon,
  kicker,
  title,
  sub,
  onClose,
}: {
  icon?: ReactNode;
  kicker?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <header className="sheet-header">
      {icon}
      <div className="sheet-heading">
        {kicker && <div className="sheet-kicker">{kicker}</div>}
        <h2>{title}</h2>
        {sub && <div className="sheet-sub">{sub}</div>}
      </div>
      <button
        type="button"
        className="round-button"
        onClick={onClose}
        aria-label={t('sheet.close')}
        data-autofocus
      >
        <X size={20} aria-hidden="true" />
      </button>
    </header>
  );
}
