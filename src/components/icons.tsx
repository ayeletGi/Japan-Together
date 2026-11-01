/** Small drawn icons that lucide does not have, in lucide's stroke style. */

import { createLucideIcon } from 'lucide-react';

interface IconProps {
  size?: number;
}

/** A torii gate, for the "Useful" tab. */
export function ToriiIcon({ size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 5q9 3 18 0M5 9h14M7 6.5V21M17 6.5V21" />
    </svg>
  );
}

/** The app's cat: a white face with ears, used as the brand mark. */
export function CatMark({ size = 26 }: IconProps) {
  return (
    <svg width={size} height={(size * 28) / 34} viewBox="0 0 34 28" aria-hidden="true">
      <path
        d="M3 26 L4 5 L11 12 L23 12 L30 5 L31 26 Q17 32 3 26Z"
        fill="var(--cat-face)"
        stroke="var(--cat)"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="18" r="1.6" fill="var(--cat)" />
      <circle cx="22" cy="18" r="1.6" fill="var(--cat)" />
    </svg>
  );
}

/** A kimono: sloped sleeves, crossed collar and the obi band. Built as a lucide icon so it fits any icon slot. */
export const KimonoIcon = createLucideIcon('Kimono', [
  [
    'path',
    {
      d: 'M9.5 4 3 6.5V14h4M14.5 4 21 6.5V14h-4M7 8.5V21h10V8.5M9.5 4l4.5 6M14.5 4 12 7.4M7 10h10M7 14h10',
      key: 'kimono',
    },
  ],
]);
