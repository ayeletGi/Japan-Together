import { useEffect, type RefObject } from 'react';

const REVEALED = '.card, .reveal-item';

/**
 * Cards that start below the fold fade and rise into place as they scroll in. Runs once per
 * screen (`screenKey`). Only elements below the fold on entry are touched, and without
 * IntersectionObserver nothing is hidden at all.
 */
export function useScrollReveal(container: RefObject<HTMLElement | null>, screenKey: string) {
  useEffect(() => {
    const root = container.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    const fold = window.innerHeight;
    for (const element of root.querySelectorAll<HTMLElement>(REVEALED)) {
      if (element.getBoundingClientRect().top <= fold) continue;
      element.classList.add('reveal');
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [container, screenKey]);
}
