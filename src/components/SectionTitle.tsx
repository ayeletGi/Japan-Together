import type { ReactNode } from 'react';
import './SectionTitle.css';

/** A section heading in ink, with an optional action on the other side. */
export function SectionTitle({
  id,
  action,
  children,
}: {
  id?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="section-title">
      <h2 id={id}>{children}</h2>
      {action}
    </div>
  );
}
