import type { ReactNode } from 'react';
import type { Tone } from './tone';
import './Pill.css';

/** A small rounded label in one of the pastel tones. */
export function Pill({
  tone = 'pink',
  icon,
  className = '',
  children,
}: {
  tone?: Tone | 'card';
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`pill tone-${tone} ${className}`.trim()}>
      {icon}
      {children}
    </span>
  );
}
