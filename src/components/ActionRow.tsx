import { ArrowUpLeft, ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { ExternalLink } from './ExternalLink';
import { IconTile } from './IconTile';
import type { Tone } from './tone';
import './ActionRow.css';

type Target =
  | { href: string; external?: boolean; onClick?: never }
  | { onClick: () => void; href?: never; external?: never };

/**
 * A full-width white row: a small icon square, a title with a muted line under it, and a chevron
 * (or an "opens outside" arrow for external links). Used for settings, help links and tickets.
 */
export function ActionRow({
  icon,
  tone = 'pink',
  title,
  sub,
  trailing,
  ...target
}: {
  icon: ReactNode;
  tone?: Tone;
  title: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
} & Target) {
  const body = (
    <>
      <IconTile tone={tone} size="sm">
        {icon}
      </IconTile>
      <span className="action-row-text">
        <span>{title}</span>
        {sub && <small>{sub}</small>}
      </span>
      {trailing !== undefined ? (
        trailing
      ) : target.external ? (
        <ArrowUpLeft size={15} className="flip-ltr action-row-end" aria-hidden="true" />
      ) : (
        <ChevronLeft size={16} className="flip-ltr action-row-end" aria-hidden="true" />
      )}
    </>
  );
  if (target.href !== undefined && target.external)
    return (
      <ExternalLink className="action-row" href={target.href}>
        {body}
      </ExternalLink>
    );
  if (target.href !== undefined)
    return (
      <a className="action-row" href={target.href}>
        {body}
      </a>
    );
  return (
    <button type="button" className="action-row" onClick={target.onClick}>
      {body}
    </button>
  );
}
