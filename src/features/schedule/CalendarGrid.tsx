import {
  Castle,
  Gamepad2,
  Moon,
  Plane,
  ShoppingBag,
  Sparkles,
  TrainFront,
  Trees,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Hanko } from '../../components/Hanko';
import { KimonoIcon } from '../../components/icons';
import { cityTone } from '../../data/cities';
import { useLanguage } from '../../i18n';
import { dayOfMonth, formatDayMonth, formatWeekdayLetter } from '../../lib/dates';
import { calendarWeeks, citySpans, homeCity, weekRibbons } from './calendar';
import { calendarDays, type CellIcon } from './calendarDays';

const cellIcons: Record<CellIcon, LucideIcon> = {
  plane: Plane,
  art: Sparkles,
  train: TrainFront,
  park: Trees,
  moon: Moon,
  kimono: KimonoIcon,
  game: Gamepad2,
  shop: ShoppingBag,
  castle: Castle,
};

/** City names on the ribbons; the flight days have their own label. */
const ribbonLabel = {
  tokyo: 'places.tokyo',
  kobe: 'places.kobe',
  osaka: 'places.osaka',
  kyoto: 'places.kyoto',
  disney: 'places.disney',
  flight: 'places.flight',
} as const;

/**
 * Three week rows, Sunday to Saturday. Each trip day shows its main thing and at most two extra
 * lines; under each week, city ribbons in the city colours. Tapping a day presses the red 済
 * hanko onto it (or lifts it).
 */
export function CalendarGrid({
  stamped,
  today,
  fresh,
  onToggle,
}: {
  stamped: Set<string>;
  today: string | null;
  fresh: string | null;
  onToggle: (date: string) => void;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const spans = citySpans();
  const weeks = calendarWeeks();
  return (
    <div className="calendar card" role="group" aria-label={t('schedule.calendarLabel')}>
      <div className="calendar-head" aria-hidden="true">
        {weeks[0].map((date) => (
          <span key={date}>{formatWeekdayLetter(date, lang)}</span>
        ))}
      </div>
      {weeks.map((week) => (
        <div className="calendar-week" key={week[0]}>
          {week.map((date, index) => {
            const column = { gridColumn: `${index * 2 + 1} / span 2` };
            const cell = calendarDays[date];
            if (!cell)
              return (
                <span key={date} className="calendar-cell is-off" style={column}>
                  <b className="num">{dayOfMonth(date)}</b>
                </span>
              );
            const Icon = cellIcons[cell.icon];
            const home = homeCity(date, spans);
            const dayTrip =
              cell.icon !== 'train' &&
              cell.city !== 'flight' &&
              home !== undefined &&
              home !== 'flight' &&
              home !== cell.city;
            const done = stamped.has(date);
            const main = cell.main[lang];
            return (
              <button
                key={date}
                type="button"
                className={`calendar-cell${date === today ? ' is-today' : ''}${date === fresh ? ' is-thud' : ''}`}
                style={column}
                data-city={cell.city}
                aria-pressed={done}
                aria-label={t(done ? 'schedule.cellDone' : 'schedule.cell', {
                  date: formatDayMonth(date, lang),
                  main,
                })}
                onClick={() => onToggle(date)}
              >
                {done && <Hanko fresh={date === fresh} />}
                <b className="num">{dayOfMonth(date)}</b>
                <Icon size={16} className="calendar-icon" aria-hidden="true" />
                <span className="calendar-main">{main}</span>
                {cell.extra?.map((line) => (
                  <span key={line.en} className="calendar-extra">
                    {line[lang]}
                  </span>
                ))}
                {dayTrip && (
                  <span className="calendar-trip">
                    {t('schedule.dayTrip', { city: t(ribbonLabel[cell.city]) })}
                  </span>
                )}
              </button>
            );
          })}
          {weekRibbons(week[0], spans).map((ribbon) => (
            <span
              key={`${ribbon.city}-${ribbon.columnStart}`}
              className={`calendar-ribbon tone-${cityTone[ribbon.city]}${ribbon.roundStart ? ' is-start' : ''}${ribbon.roundEnd ? ' is-end' : ''}`}
              style={{ gridColumn: `${ribbon.columnStart} / ${ribbon.columnEnd}` }}
              aria-hidden="true"
            >
              {ribbon.labelled && t(ribbonLabel[ribbon.city])}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
