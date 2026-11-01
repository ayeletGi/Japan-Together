/**
 * Keeps the home-screen app on the newest version. A phone usually brings the app back from the
 * background instead of opening it again, so the browser never looks for a new sw.js by itself.
 * This looks whenever the app comes back to the screen (and every half hour while it is open),
 * and once the new version has taken over, reloads the page so it actually shows. It waits while
 * something is being typed, so a half-written note is never lost.
 */
const CHECK_EVERY_MS = 30 * 60 * 1000;
/** While an update waits for typing to end, how often to look again. */
const FREE_CHECK_MS = 2000;

function isTyping(): boolean {
  const field = document.activeElement;
  return (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement ||
    (field instanceof HTMLElement && field.isContentEditable)
  );
}

export function startAppUpdates(): void {
  const { serviceWorker } = navigator;
  // The first install also takes over the page; that is not an update.
  let hadVersion = Boolean(serviceWorker.controller);
  let reloadWaiting = false;

  const reloadWhenFree = () => {
    if (!reloadWaiting) return;
    if (document.visibilityState === 'hidden' || !isTyping()) location.reload();
  };

  serviceWorker.addEventListener('controllerchange', () => {
    if (!hadVersion) {
      hadVersion = true;
      return;
    }
    if (reloadWaiting) return;
    reloadWaiting = true;
    reloadWhenFree();
    setInterval(reloadWhenFree, FREE_CHECK_MS);
  });
  document.addEventListener('visibilitychange', reloadWhenFree);

  window.addEventListener('load', () => {
    void serviceWorker.register('./sw.js').then((registration) => {
      const check = () => {
        if (document.visibilityState === 'visible' && navigator.onLine)
          void registration.update().catch(() => undefined);
      };
      document.addEventListener('visibilitychange', check);
      window.addEventListener('online', check);
      setInterval(check, CHECK_EVERY_MS);
    });
  });
}
