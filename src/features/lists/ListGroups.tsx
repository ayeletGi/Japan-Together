import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LIST_OWNERS, type ListOwner } from '../../../shared/liveSchema';
import { groupPoints, listProgress, type List } from './lists';

/**
 * Three stamps above the list chips, like the stamp rally's: Dana's lists, Noa's and the ones
 * we share. The picked group is stamped (solid ring, tilted); its lists are the chips below.
 * A chip dragged over a stamp moves its list there (`dropTarget` is the stamp it is over).
 * Each stamp wears its group's points; a tick makes that sticker bump and float "+10".
 */
export function ListGroups({
  lists,
  group,
  dropTarget,
  onPick,
}: {
  lists: List[];
  group: ListOwner;
  dropTarget?: ListOwner;
  onPick: (group: ListOwner) => void;
}) {
  const { t } = useTranslation();
  const points = pointsByGroup(lists);
  // Only a new tick pops a sticker: a list moved to another group carries its points quietly.
  const previous = useRef({ points, ticked: tickedCount(lists) });
  const [pop, setPop] = useState<{ owner: ListOwner; gained: number; key: number } | null>(null);
  useEffect(() => {
    const was = previous.current;
    const now = { points: pointsByGroup(lists), ticked: tickedCount(lists) };
    previous.current = now;
    if (now.ticked <= was.ticked) return;
    const owner = LIST_OWNERS.find((each) => now.points[each] > was.points[each]);
    if (owner)
      setPop((last) => ({
        owner,
        gained: now.points[owner] - was.points[owner],
        key: (last?.key ?? 0) + 1,
      }));
  }, [lists]);
  return (
    <div className="list-groups" role="group" aria-label={t('lists.chooseGroup')}>
      {LIST_OWNERS.map((owner) => (
        <button
          type="button"
          key={owner}
          className={`list-group list-group--${owner}${owner === dropTarget ? ' list-group--drop' : ''}`}
          data-owner={owner}
          aria-pressed={owner === group}
          onClick={() => onPick(owner)}
        >
          <span className="list-group-seal">
            <GroupCats owner={owner} />
            <span
              // A new key remounts it, which replays the bump; its own prefix keeps it apart from the "+N" beside it.
              key={pop?.owner === owner ? `points-${pop.key}` : undefined}
              className={`list-group-points num${pop?.owner === owner ? ' is-popping' : ''}`}
            >
              {t('lists.points', { points: points[owner] })}
            </span>
            {pop?.owner === owner && (
              <span
                key={`pop-${pop.key}`}
                className="list-group-pop num"
                dir="ltr"
                aria-hidden="true"
              >
                +{pop.gained}
              </span>
            )}
          </span>
          <span className="list-group-name">{t(`lists.groups.${owner}`)}</span>
          <small className="list-group-count">
            {t('lists.groupCount', {
              count: lists.filter((list) => list.owner === owner).length,
            })}
          </small>
        </button>
      ))}
    </div>
  );
}

const pointsByGroup = (lists: List[]) =>
  Object.fromEntries(LIST_OWNERS.map((owner) => [owner, groupPoints(lists, owner)])) as Record<
    ListOwner,
    number
  >;

const tickedCount = (lists: List[]) =>
  lists.reduce((sum, list) => sum + listProgress(list).done, 0);

/** The rally map's cat (34×34), Dana's with pink ears, Noa's with lavender ones. */
function Cat({
  who,
  x = 0,
  y = 0,
  scale = 1,
}: {
  who: 'dana' | 'noa';
  x?: number;
  y?: number;
  scale?: number;
}) {
  return (
    <g className={`group-cat group-cat--${who}`} transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Drawn smaller, it keeps the same outline. */}
      <path
        className="group-cat-face"
        strokeWidth={1.8 / scale}
        d="M3 28 L4 6 L11 13 L23 13 L30 6 L31 28 Q17 34 3 28Z"
      />
      <path className="group-cat-ear" d="M7 12 L8 9 L10 12Z M27 12 L26 9 L24 12Z" />
      <circle className="group-cat-eye" cx="12" cy="20" r="1.8" />
      <circle className="group-cat-eye" cx="22" cy="20" r="1.8" />
      <path className="group-cat-cheek" d="M6 23h3M25 23h3" />
    </g>
  );
}

const PETALS = [
  [27, 2.5],
  [30.2, 4.8],
  [29, 8.4],
  [25, 8.4],
  [23.8, 4.8],
];
const DANGO = ['group-dango--pink', 'group-dango--white', 'group-dango--green'];

/** Each group's stamp: one cat (Noa's with a flower), or the two of us sharing dango. */
export function GroupCats({ owner }: { owner: ListOwner }) {
  return (
    <svg className="list-group-cats" viewBox="0 0 34 34" aria-hidden="true">
      {owner === 'both' ? (
        <>
          <Cat who="dana" x={-1.5} y={15} scale={0.44} />
          <Cat who="noa" x={20.5} y={15} scale={0.44} />
          <path className="group-dango-stick" d="M17 31 L17 3" />
          {DANGO.map((ball, index) => (
            <circle
              key={ball}
              className={`group-dango ${ball}`}
              cx="17"
              cy={8 + index * 5.4}
              r="2.7"
            />
          ))}
        </>
      ) : (
        <>
          <Cat who={owner} />
          {owner === 'noa' && (
            <g className="group-flower">
              {PETALS.map(([cx, cy]) => (
                <circle key={`${cx} ${cy}`} cx={cx} cy={cy} r="2.3" />
              ))}
              <circle className="group-flower-heart" cx="27" cy="5.6" r="1.8" />
            </g>
          )}
        </>
      )}
    </svg>
  );
}
