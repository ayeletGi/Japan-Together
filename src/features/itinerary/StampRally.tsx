import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../app/toastContext';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { useLanguage } from '../../i18n';
import { RallyMap } from './RallyMap';

const POINTS_PER_STAMP = 50;

/**
 * "The day's stamp rally": a short map with the cat and the day's points. The stamps themselves
 * sit on the day's plan, one per stop; a new one is announced in a toast.
 */
export function StampRally({
  date,
  count,
  reached,
  dayTitle,
  onStop,
  onHome,
}: {
  date: string;
  /** How many stops the day has. */
  count: number;
  reached: number;
  dayTitle: string;
  onStop: (index: number) => void;
  /** Tapping the hotel on the map; before the trip it clears the stamps (the cat back at stop 1). */
  onHome?: () => void;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const toast = useToast();

  // The plan inks the stamps from the same `reached`; here a new one is announced (the first
  // render stays quiet).
  const previous = useRef<{ date: string; reached: number } | null>(null);
  const last = previous.current?.date === date ? previous.current.reached : reached;
  useEffect(() => {
    if (reached > last) toast(t('rally.newStamp', { points: (reached - last) * POINTS_PER_STAMP }));
    previous.current = { date, reached };
  }, [reached, last, date, toast, t]);

  return (
    <Card ears className="rally" aria-labelledby="rally-title">
      <div className="spread">
        <h2 id="rally-title" className="rally-title">
          {t('rally.title')}
        </h2>
        <Pill tone="lav" className="num">
          {t('rally.points', { points: reached * POINTS_PER_STAMP })}
        </Pill>
      </div>
      <RallyMap
        count={count}
        reached={reached}
        rtl={lang === 'he'}
        title={dayTitle}
        onStop={onStop}
        onHome={onHome}
      />
    </Card>
  );
}
