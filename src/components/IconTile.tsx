import type { ReactNode } from 'react';
import type { Tone } from './tone';
import './IconTile.css';

/** A rounded square holding an icon, tinted in a pastel tone. */
export function IconTile({
  tone = 'pink',
  size = 'md',
  children,
}: {
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}) {
  return (
    <span className={`icon-tile icon-tile--${size} tone-${tone}`} aria-hidden="true">
      {children}
    </span>
  );
}
