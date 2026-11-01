import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { Sheet, SheetHeader } from '../../components/Sheet';
import { hotels, JP_NAME_CHECKED, type HotelId } from '../../data/hotels';
import './taxi-card.css';

/** The hotel's Japanese name as big as it fits, to hold up to a taxi driver. */
export function TaxiSheet({ hotelId }: { hotelId: HotelId }) {
  const { t } = useTranslation();
  const { close } = useSheet();
  const hotel = hotels[hotelId];
  return (
    <Sheet label={t('hotels.taxi')} onClose={close}>
      <SheetHeader kicker={t('hotels.taxi')} title={<bdi>{hotel.name}</bdi>} onClose={close} />
      <div className="sheet-body taxi-big">
        <p className="jp taxi-big-name" lang="ja">
          {hotel.jpName}
        </p>
        {!JP_NAME_CHECKED.has(hotelId) && <p className="muted">{t('hotels.jpUnchecked')}</p>}
      </div>
    </Sheet>
  );
}
