/**
 * Opening links in the phone's real browser.
 *
 * On Android, a site added to the home screen runs as its own app, and Chrome opens
 * `target="_blank"` links in an in-app sheet on top of it instead of a separate window.
 * An `intent://` URL hands the link to Android, which opens it in the browser (or the matching
 * app, such as Google Maps) as its own window.
 */

/** True when running as an installed home-screen app on Android. */
export function isAndroidHomeScreenApp(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!/Android/i.test(navigator.userAgent)) return false;
  const modes = ['standalone', 'fullscreen', 'minimal-ui'];
  return modes.some((mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches);
}

/** The Android intent URL that opens `href` outside the app, or null for non-web links. */
export function androidIntentUrl(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const scheme = url.protocol.slice(0, -1);
  const rest = href.slice(href.indexOf('//') + 2).split('#')[0];
  const fallback = encodeURIComponent(url.href);
  return `intent://${rest}#Intent;scheme=${scheme};action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end`;
}
