import type { AnchorHTMLAttributes } from 'react';

/** A link that opens outside the app (maps, official sites) in a new tab. */
export function ExternalLink(
  props: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'>,
) {
  return <a {...props} target="_blank" rel="noreferrer" />;
}
