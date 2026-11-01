import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { SectionTitle } from '../../components/SectionTitle';
import { dailyBudget } from '../../data/dailyBudget';
import { tripToday } from '../../data/trip';
import { useContentProps, useLanguage } from '../../i18n';
import { rangeTotals, yenToShekels } from '../../lib/dailyBudget';
import { formatDayDot, formatDotted, formatWeekdayLetter } from '../../lib/dates';
import { formatShekelsRounded } from '../../lib/money';
import { isTripMode } from '../../lib/tripMode';
import { useYenRate } from '../yen/rate';

const first = dailyBudget[0].date;
const last = dailyBudget[dailyBudget.length - 1].date;

const parts = [
  { key: 'food', color: 'var(--coin)' },
  { key: 'extra', color: 'var(--sky-strong)' },
  { key: 'shop', color: 'var(--lav-ink)' },
  { key: 'move', color: 'var(--mint)' },
] as const;

/** Today during the trip, otherwise the whole trip. */
function initialRange(): { from: string; to: string } {
  const now = new Date();
  const today = tripToday(now);
  if (isTripMode(now) && dailyBudget.some((day) => day.date === today)) {
    return { from: today, to: today };
  }
  return { from: first, to: last };
}

/**
 * The daily budget per person: tap a day for that day, or a second day to add up the range
 * between them. Shows card and cash apart, and the split into food, on-site, shopping and rides.
 */
export function DailyBudgetCard() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const content = useContentProps();
  const [range, setRange] = useState(initialRange);
  const rowRef = useRef<HTMLDivElement>(null);
  const { rate } = useYenRate();
  const ilsPerJpy = rate.ilsPerJpy;
  const shekels = (yen: number) => formatShekelsRounded(yenToShekels(yen, ilsPerJpy) * 100);
  const totals = rangeTotals(range.from, range.to, undefined, ilsPerJpy);
  const single = range.from === range.to;
  const firstDay = totals.days[0];

  // Keep the first chosen day in view inside the row of days (not by scrolling the page).
  useEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip) return;
    const rowBox = row.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    if (chipBox.left < rowBox.left || chipBox.right > rowBox.right) {
      row.scrollBy({ left: chipBox.left + chipBox.width / 2 - (rowBox.left + rowBox.width / 2) });
    }
  }, [range.from]);

  const pick = (date: string) =>
    setRange((current) =>
      current.from === current.to && current.from !== date
        ? {
            from: current.from < date ? current.from : date,
            to: current.from < date ? date : current.from,
          }
        : { from: date, to: date },
    );

  return (
    <section className="daily" aria-labelledby="daily-title">
      <SectionTitle
        id="daily-title"
        action={
          <button
            type="button"
            className="daily-all"
            aria-pressed={range.from === first && range.to === last}
            onClick={() => setRange({ from: first, to: last })}
          >
            {t('daily.wholeTrip')}
          </button>
        }
      >
        {t('daily.title')}
      </SectionTitle>
      <Card className="daily-card">
        <p className="daily-hint muted">{t('daily.hint')}</p>
        <div className="daily-days" ref={rowRef}>
          {dailyBudget.map((day) => {
            const ends = day.date === range.from || day.date === range.to;
            const inside = day.date > range.from && day.date < range.to;
            return (
              <button
                key={day.date}
                type="button"
                className={`daily-day${inside ? ' is-inside' : ''}`}
                aria-pressed={ends}
                onClick={() => pick(day.date)}
              >
                <small>{formatWeekdayLetter(day.date, lang)}</small>
                <b className="num">{formatDayDot(day.date)}</b>
              </button>
            );
          })}
        </div>

        <div className="daily-head">
          <span>
            {single ? (
              <>
                {t('daily.oneDay', {
                  weekday: formatWeekdayLetter(range.from, lang),
                  date: formatDayDot(range.from),
                })}
                {firstDay && (
                  <>
                    {' · '}
                    <bdi {...content}>{firstDay.area}</bdi>
                  </>
                )}
              </>
            ) : (
              t('daily.range', {
                count: totals.days.length,
                from: formatDayDot(range.from),
                to: formatDayDot(range.to),
              })
            )}
            {totals.move > 0 && (
              <small className="muted">
                {t('daily.withMove', { amount: shekels(totals.move) })}
              </small>
            )}
          </span>
          <strong className="daily-total num">{shekels(totals.total)}</strong>
        </div>

        <div className="daily-pay">
          <div className="daily-pay-card">
            {t('daily.card')}
            <b className="num">{shekels(totals.card)}</b>
          </div>
          <div className="daily-pay-cash">
            {t('daily.cash')}
            <b className="num">{shekels(totals.cash)}</b>
            <small className="muted">
              {t('daily.cashBoth', { amount: shekels(totals.cash * 2) })}
            </small>
          </div>
        </div>

        <div className="budget-bar" aria-hidden="true">
          {parts.map(({ key, color }) =>
            totals[key] > 0 ? (
              <span key={key} style={{ flexGrow: totals[key], background: color }} />
            ) : null,
          )}
        </div>
        <ul className="budget-rows">
          {parts.map(({ key, color }) => (
            <li key={key}>
              <span>
                <i className="budget-dot" style={{ background: color }} />
                {t(`daily.${key}`)}
              </span>
              <b className="num">{shekels(totals[key])}</b>
            </li>
          ))}
        </ul>
        <p className="daily-note muted">
          {t('daily.note', { rate: ilsPerJpy.toFixed(4), date: formatDotted(rate.date) })}
        </p>
      </Card>
    </section>
  );
}
