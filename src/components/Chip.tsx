import { Check, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import './Chip.css';

/** A filter toggle. When on it is filled pink with dark text, never greyed out. */
export function Chip({
  pressed,
  onClick,
  children,
  count,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  const Icon = pressed ? Check : Plus;
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      <Icon size={14} aria-hidden="true" />
      {children}
      {count !== undefined && <span className="chip-count num">{count}</span>}
    </button>
  );
}
