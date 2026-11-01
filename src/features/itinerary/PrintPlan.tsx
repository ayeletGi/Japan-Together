import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n';
import { dayHeading, stopTime, type ExportDay } from './exportPlan';

/** The printed (PDF) plan: a heading and a table per day. Only shown by `@media print`. */
export function PrintPlan({ days }: { days: ExportDay[] }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  return (
    <div className="print-plan">
      {days.map((exported) => (
        <section key={exported.day.date} className="print-day">
          <h2>{dayHeading(exported, t, lang)}</h2>
          {exported.day.route && (
            <p>
              {t('export.route')}: <bdi>{exported.day.route}</bdi>
            </p>
          )}
          {exported.hotel && (
            <p>
              {t('export.hotel')}: <bdi>{exported.hotel}</bdi>
            </p>
          )}
          <table>
            <thead>
              <tr>
                <th>{t('export.columns.time')}</th>
                <th>{t('export.columns.stop')}</th>
                <th>{t('export.columns.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {exported.stops.map((stop) => (
                <tr key={stop.id}>
                  <td className="num">{stopTime(stop, t)}</td>
                  <td>
                    <bdi>{stop.title}</bdi>
                    {stop.leave && (
                      <small>
                        {t('plan.leaveAt')}
                        {stop.leave.leave}
                      </small>
                    )}
                  </td>
                  <td>
                    <bdi>{stop.note}</bdi>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
