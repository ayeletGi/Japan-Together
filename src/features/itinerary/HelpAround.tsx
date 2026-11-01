import {
  CalendarPlus,
  Compass,
  Images,
  MapPin,
  ShoppingBag,
  TrainFront,
  Utensils,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActionRow } from '../../components/ActionRow';
import { photoFolderFor } from '../../data/dayFolders';
import { searchUrl } from '../../lib/maps';
import { helpAround } from './helpLinks';
import { recommendationFor } from './recommendations';
import type { PlanStop } from './stops';

/** "Around the stop": getting there, vegan food, shops, a konbini, the calendar and photos. */
export function HelpAround({ stops, index }: { stops: PlanStop[]; index: number }) {
  const { t } = useTranslation();
  const help = helpAround(stops, index);
  const stop = stops[index];
  const photos = photoFolderFor(stop.date);
  const more = stop.event && recommendationFor(stop.event);
  return (
    <section className="help-around" aria-labelledby="help-title">
      <h3 id="help-title">{t('help.title')}</h3>
      <div className="action-list">
        {help.directions && (
          <ActionRow
            external
            href={help.directions.url}
            icon={<TrainFront size={18} />}
            tone="sky"
            title={t('help.directions')}
            sub={
              help.directions.from ? (
                <>
                  {t('common.fromPrefix')}
                  <bdi>{help.directions.from}</bdi> · {t('help.transit')}
                </>
              ) : (
                t('help.fromHere')
              )
            }
          />
        )}
        {help.food.length ? (
          help.food.map((place) => (
            <ActionRow
              key={place.id}
              external
              href={searchUrl(place.mapsQuery)}
              icon={<Utensils size={18} />}
              tone="sun"
              title={<bdi>{place.name}</bdi>}
              sub={t('help.veganPlace')}
            />
          ))
        ) : (
          <ActionRow
            external
            href={help.foodSearch}
            icon={<Utensils size={18} />}
            tone="sun"
            title={t('help.veganNearby')}
            sub={t('help.searchNear')}
          />
        )}
        {help.shops.map((shop) => (
          <ActionRow
            key={shop.name}
            external
            href={searchUrl(shop.mapsQuery)}
            icon={<ShoppingBag size={18} />}
            tone="lav"
            title={<bdi>{shop.name}</bdi>}
            sub={<bdi>{shop.kind}</bdi>}
          />
        ))}
        {more && (
          <ActionRow
            href={more.href}
            icon={<Compass size={18} />}
            tone="pink"
            title={t(`event.recommendations.${more.kind}`)}
            sub={t('help.inDiscover')}
          />
        )}
        <ActionRow
          external
          href={help.konbini}
          icon={<MapPin size={18} />}
          tone="mint"
          title={t('help.konbini')}
          sub={t('help.konbiniSub')}
        />
        {help.calendar && (
          <ActionRow
            external
            href={help.calendar.url}
            icon={<CalendarPlus size={18} />}
            tone="pink"
            title={t('help.calendar')}
            sub={
              help.calendar.start ? (
                <>
                  <bdi className="num" dir="ltr">
                    {help.calendar.start}–{help.calendar.end}
                  </bdi>{' '}
                  {t('time.japanClock')}
                </>
              ) : (
                t('help.allDay')
              )
            }
          />
        )}
        {photos && (
          <ActionRow
            external
            href={photos}
            icon={<Images size={18} />}
            tone="lav"
            title={t('help.photos')}
            sub={t('help.photosSub')}
          />
        )}
      </div>
    </section>
  );
}
