import { CarTaxiFront } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { hotels, JP_NAME_CHECKED, type HotelId } from '../../data/hotels';
import './taxi-card.css';

/** The hotel's Japanese name, large, to show a taxi driver. */
export function TaxiCard({
  hotelId,
  label,
  action,
  calm = false,
  icon,
  onExpand,
}: {
  hotelId: HotelId;
  label?: string;
  action?: ReactNode;
  /** A white card instead of the lavender block. */
  calm?: boolean;
  /** Shown before the label instead of the big taxi icon. */
  icon?: ReactNode;
  /** Makes the name tappable, to show it big. */
  onExpand?: () => void;
}) {
  const { t } = useTranslation();
  const hotel = hotels[hotelId];
  return (
    <section
      className={`taxi-card${calm ? ' taxi-card--calm' : ''}`}
      aria-label={label ?? t('hotels.taxi')}
    >
      <div className="taxi-text">
        <small className="taxi-label">
          {icon}
          {label ?? t('hotels.taxi')}
        </small>
        {onExpand ? (
          <button
            type="button"
            className="taxi-expand"
            onClick={onExpand}
            aria-label={t('hotels.showBig', { name: hotel.name })}
          >
            <span className="jp taxi-name" lang="ja">
              {hotel.jpName}
            </span>
            <small>
              <bdi>{hotel.name}</bdi>
            </small>
          </button>
        ) : (
          <>
            <span className="jp taxi-name" lang="ja">
              {hotel.jpName}
            </span>
            <small>
              <bdi>{hotel.name}</bdi>
            </small>
          </>
        )}
        {!JP_NAME_CHECKED.has(hotelId) && (
          <small className="taxi-unchecked">{t('hotels.jpUnchecked')}</small>
        )}
        {action}
      </div>
      {!icon && <CarTaxiFront size={28} aria-hidden="true" />}
    </section>
  );
}
