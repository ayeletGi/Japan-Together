/** One city block is drawn 400 wide; the drawing's top sits at y 92 and its ground at y 200. */
const TILE_WIDTH = 400;
const TILE_TOP = 92;
const TILE_HEIGHT = 108;
/** The skyline's height in CSS (`.skyline`), so the ground lands on the hero's bottom edge. */
const SKYLINE_HEIGHT = 100;

/** The drawing's coordinates → a tile's, whose top-left is 0 0. */
const DRAWING_TO_TILE = `translate(0 ${-TILE_TOP})`;
/** A tile → the middle of the hero, its ground on the bottom edge. */
const CENTRE_TILE = `translate(${-TILE_WIDTH / 2} ${SKYLINE_HEIGHT - TILE_HEIGHT})`;

/**
 * The drawn city at the bottom of the hero: buildings, Fuji, sakura trees and the cat on a roof.
 * The city keeps its phone size and repeats sideways on wider screens instead of being blown up;
 * the cat stays on the middle block only.
 */
export function Skyline() {
  return (
    <svg className="skyline" aria-hidden="true">
      <defs>
        <pattern
          id="skyline-block"
          x="50%"
          width={TILE_WIDTH}
          height={TILE_HEIGHT}
          patternUnits="userSpaceOnUse"
          patternTransform={CENTRE_TILE}
        >
          <g transform={DRAWING_TO_TILE}>
            <CityBlock />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#skyline-block)" />
      <svg x="50%" overflow="visible">
        <g transform={`${CENTRE_TILE} ${DRAWING_TO_TILE}`}>
          <path className="sk-cat" d="M312 112 L314 102 L320 108 L328 108 L334 102 L336 112Z" />
          <path className="sk-tail" d="M336 111 q10 -2 7 -12" />
        </g>
      </svg>
    </svg>
  );
}

function CityBlock() {
  return (
    <>
      <path className="sk-fuji" d="M160 160 L215 104 L270 160Z" />
      <path className="sk-cap" d="M197 122 L215 104 L233 122 L225 118 L215 127 L205 118Z" />
      <rect className="sk-b1" x="0" y="118" width="50" height="84" />
      <rect className="sk-b2" x="50" y="134" width="44" height="68" />
      <rect className="sk-b3" x="94" y="150" width="56" height="52" />
      <path className="sk-pink" d="M92 150h60l-6 9h-48z" />
      <rect className="sk-b4" x="300" y="112" width="52" height="90" />
      <rect className="sk-b3" x="352" y="128" width="48" height="74" />
      <rect className="sk-b1" x="262" y="138" width="40" height="64" />
      {[
        [8, 128],
        [26, 128],
        [8, 148],
        [310, 122],
        [330, 122],
        [310, 142],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} className="sk-window" x={x} y={y} width="10" height="10" rx="2" />
      ))}
      <rect className="sk-pink" x="44" y="128" width="10" height="34" rx="2" />
      <circle className="sk-tree" cx="80" cy="130" r="18" />
      <circle className="sk-tree-2" cx="64" cy="138" r="12" />
      <circle className="sk-tree" cx="382" cy="124" r="13" />
    </>
  );
}
