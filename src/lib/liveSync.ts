import { liveChanges, setLiveChanges } from '../data/live';

/**
 * Keeps this phone's copy of the live changes current: on opening, when the app comes back to
 * the screen or the phone gets signal again, and every few minutes while it is open. Without
 * signal (or where the request is blocked, as inside claude.ai) nothing happens and the saved
 * copy stays.
 */

/** The Cloudflare build asks its own server; the artifact and offline copies ask the live site. */
export const LIVE_API =
  import.meta.env.MODE === 'web' ? '/api' : 'https://japan-together-demo.example.workers.dev/api';
const EVERY_MS = 2 * 60 * 1000;
const TIMEOUT_MS = 10 * 1000;

async function fetchChanges(): Promise<void> {
  if (!navigator.onLine) return;
  try {
    const response = await fetch(`${LIVE_API}/changes?since=${liveChanges().version}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return;
    const body = (await response.json()) as { unchanged?: boolean };
    if (!body.unchanged) setLiveChanges(body);
  } catch {
    // Offline, slow or blocked: keep the saved copy.
  }
}

let running: Promise<void> | null = null;
let queued: Promise<void> | null = null;

/**
 * Fetches newer changes. While a fetch is running, one more follows it (for a change saved in
 * the meantime), and everyone who asks meanwhile waits for that same one.
 */
export function refreshLiveChanges(): Promise<void> {
  if (!running) {
    running = fetchChanges().finally(() => {
      running = null;
    });
    return running;
  }
  queued ??= running.then(() => {
    queued = null;
    return refreshLiveChanges();
  });
  return queued;
}

let started = false;

export function startLiveSync(): void {
  if (started) return;
  started = true;
  void refreshLiveChanges();
  const refreshIfShown = () => {
    if (document.visibilityState === 'visible') void refreshLiveChanges();
  };
  document.addEventListener('visibilitychange', refreshIfShown);
  window.addEventListener('online', refreshIfShown);
  setInterval(refreshIfShown, EVERY_MS);
}
