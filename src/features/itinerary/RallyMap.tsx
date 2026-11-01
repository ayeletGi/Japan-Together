import { useTranslation } from 'react-i18next';
import { CatFace } from './CatFace';
import { catStop, MAP_HEIGHT, MAP_WIDTH, routePath, stopPoints } from './rallyGeometry';

/** Offset from a stop's point to the cat drawing's top-left corner, so it stands on the stop. */
const CAT_OFFSET = { x: 17, y: 44 };

/**
 * The illustrated map: a river, the hotel, a dotted route (faint ahead, strong pink where walked),
 * numbered markers and the cat on the next stop to visit. Markers are a tap shortcut; before the trip
 * the plan's stamps are the accessible way to walk the cat.
 */
export function RallyMap({
  count,
  reached,
  rtl,
  title,
  onStop,
  onHome,
}: {
  count: number;
  reached: number;
  rtl: boolean;
  title: string;
  onStop?: (index: number) => void;
  onHome?: () => void;
}) {
  const { t } = useTranslation();
  const points = stopPoints(count, rtl);
  const [catX, catY] = points[catStop(count, reached)];
  const hotelX = points[0][0];
  return (
    <div className="rally-map">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label={t('rally.mapLabel', { title, reached, count })}
      >
        <path className="rally-river" d="M0 108 Q90 88 170 108 T340 98" />
        <path className="rally-route" d={routePath(points)} />
        {reached > 0 && (
          <path className="rally-route-done" d={routePath(points.slice(0, reached + 1))} />
        )}
        <g aria-hidden="true" className={onHome ? 'rally-hotel-tap' : undefined} onClick={onHome}>
          {onHome && <rect className="rally-hit" x={hotelX - 22} y="78" width="44" height="40" />}
          <rect className="rally-hotel" x={hotelX - 14} y="96" width="28" height="18" rx="5" />
          <path className="rally-hotel-roof" d={`M${hotelX - 12} 96 l12 -9 l12 9`} />
        </g>
        {points.slice(1).map(([x, y], index) => (
          <g
            key={index}
            className={`rally-marker${index < reached ? ' is-done' : index === reached ? ' is-next' : ''}`}
            onClick={onStop && (() => onStop(index))}
            aria-hidden="true"
          >
            <circle cx={x} cy={y} r="13" />
            <text x={x} y={y + 4.5}>
              {index + 1}
            </text>
          </g>
        ))}
        <g
          className="rally-cat"
          style={{ transform: `translate(${catX - CAT_OFFSET.x}px, ${catY - CAT_OFFSET.y}px)` }}
          aria-hidden="true"
        >
          <CatFace />
        </g>
      </svg>
    </div>
  );
}
