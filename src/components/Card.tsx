import type { HTMLAttributes } from 'react';
import './Card.css';

/** A frosted white card. `ears` adds the two small cat ears on its top edge. */
export function Card({
  as: Tag = 'section',
  ears = false,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article'; ears?: boolean }) {
  return <Tag className={`card${ears ? ' card--ears' : ''} ${className}`.trim()} {...props} />;
}
