import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { androidIntentUrl, isAndroidHomeScreenApp } from '../lib/openOutside';

/**
 * A link that opens outside the app (maps, official sites) in a new tab. In the Android
 * home-screen app it opens in the phone's browser as a separate window, not inside the app.
 */
export function ExternalLink(
  props: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'>,
) {
  const { onClick, href } = props;
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !href || !isAndroidHomeScreenApp()) return;
    const intent = androidIntentUrl(href);
    if (!intent) return;
    event.preventDefault();
    window.location.href = intent;
  };
  return <a {...props} onClick={handleClick} target="_blank" rel="noreferrer" />;
}
