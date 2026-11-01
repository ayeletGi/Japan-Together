import type { CSSProperties } from 'react';
import './SakuraPetals.css';

/**
 * The soft sky behind the app: three large blurred patches of white light drifting slowly, and six
 * small flat leaves falling very faintly with a gentle sway. Decorative only; hidden for reduced
 * motion. Positions are fixed so nothing jumps between renders.
 */
const CLOUDS = [
  { top: '4%', left: '-8%', w: 46, h: 18, dur: 18 },
  { top: '38%', left: '48%', w: 40, h: 15, dur: 24 },
  { top: '72%', left: '4%', w: 52, h: 19, dur: 21 },
];

const LEAVES = [
  { left: 6, tone: 1, dur: 26, delay: 0 },
  { left: 43, tone: 2, dur: 31, delay: -7.3 },
  { left: 80, tone: 3, dur: 27, delay: -14.6 },
  { left: 29, tone: 4, dur: 32, delay: -21.9 },
  { left: 66, tone: 5, dur: 28, delay: -29.2 },
  { left: 15, tone: 6, dur: 35, delay: -6.5 },
];

export function SakuraPetals() {
  return (
    <div className="sky-layer" aria-hidden="true">
      {CLOUDS.map((cloud) => (
        <span
          key={cloud.top}
          className="sky-cloud"
          style={
            {
              top: cloud.top,
              insetInlineStart: cloud.left,
              width: `${cloud.w}vmax`,
              height: `${cloud.h}vmax`,
              '--dur': `${cloud.dur}s`,
            } as CSSProperties
          }
        />
      ))}
      {LEAVES.map((leaf) => (
        <span
          key={leaf.left}
          className="sky-leaf"
          style={
            {
              insetInlineStart: `${leaf.left}%`,
              '--leaf-color': `var(--leaf-${leaf.tone})`,
              '--dur': `${leaf.dur}s`,
              '--delay': `${leaf.delay}s`,
            } as CSSProperties
          }
        >
          <i />
        </span>
      ))}
    </div>
  );
}
