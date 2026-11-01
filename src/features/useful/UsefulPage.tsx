import { CarTaxiFront, Copy, ScanBarcode, ShoppingBasket, Siren } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { useToast } from '../../app/toastContext';
import { ActionRow } from '../../components/ActionRow';
import { IconTile } from '../../components/IconTile';
import { OfflineSave } from '../../components/OfflineSave';
import { SectionTitle } from '../../components/SectionTitle';
import { kosherLinks } from '../../data/kosher';
import { hotelForMorning, hotelForNight, hotelList } from '../../data/hotels';
import { phrases } from '../../data/phrases';
import { tripToday } from '../../data/trip';
import { useNow } from '../../hooks/useNow';
import { useLanguage } from '../../i18n';
import { copyText } from '../../lib/fileOut';
import { isTripMode } from '../../lib/tripMode';
import { TaxiCard } from '../hotels/TaxiCard';
import { YenCard } from '../yen/YenCard';
import './useful.css';

const emergency = [
  { id: 'police', number: '110', big: true },
  { id: 'ambulance', number: '119', big: true },
  { id: 'tourist', number: '050-3816-2787', big: false },
  { id: 'embassy', number: '+81-3-3264-0911', big: false },
] as const;

/**
 * The Useful tab ("שימושי"): the yen converter, kosher food lists, emergency numbers, a taxi card for tonight's
 * hotel, phrases to show, and saving the app for offline use. Tickets have their own tab; the
 * checklist lives on Today.
 */
export function UsefulPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const { open } = useSheet();
  const toast = useToast();
  const now = useNow();
  const trip = isTripMode(now);

  // Tonight's hotel in Japan; before the trip, the first one.
  const today = tripToday(now);
  const tonight =
    (trip ? (hotelForNight(today) ?? hotelForMorning(today)) : undefined) ?? hotelList[0];

  const copy = async (number: string) => {
    toast(
      (await copyText(number))
        ? t('useful.copied', { number })
        : t('useful.copyFailed', { number }),
    );
  };

  return (
    <div className="wrap useful">
      <header className="useful-head">
        <p className="useful-kicker">{t('useful.kicker')}</p>
        <h1>{t('useful.title')}</h1>
      </header>

      <div className="useful-grid">
        <div className="stack">
          <YenCard />

          <section className="card kosher-card" aria-labelledby="kosher-title">
            <h2 id="kosher-title" className="card-head">
              <IconTile tone="pink" size="sm">
                <ShoppingBasket size={16} />
              </IconTile>
              {t('useful.kosher.title')}
            </h2>
            <div className="action-list kosher-links">
              {kosherLinks.map((link) => (
                <ActionRow
                  key={link.id}
                  external
                  href={link.url}
                  icon={
                    link.id === 'zekasher' ? (
                      <ScanBarcode size={18} />
                    ) : (
                      <ShoppingBasket size={18} />
                    )
                  }
                  tone="pink"
                  title={t(`useful.kosher.${link.id}.title`)}
                  sub={t(`useful.kosher.${link.id}.sub`)}
                />
              ))}
            </div>
          </section>

          <section className="card emergency-card" aria-labelledby="emergency-title">
            <h2 id="emergency-title" className="card-head">
              <IconTile tone="pink" size="sm">
                <Siren size={16} />
              </IconTile>
              {t('useful.emergency')}
            </h2>
            <div className="emergency">
              {emergency.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`emergency-tile${item.big ? ' emergency-tile--big' : ''}`}
                  title={t('useful.tapToCopy')}
                  onClick={() => void copy(item.number)}
                  aria-label={`${t(`useful.numbers.${item.id}`)} ${item.number} · ${t('useful.tapToCopy')}`}
                >
                  <span className="emergency-number num" dir="ltr">
                    {item.number}
                  </span>
                  <span className="emergency-label">{t(`useful.numbers.${item.id}`)}</span>
                  <Copy className="emergency-copy" size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>

          <TaxiCard
            calm
            icon={
              <IconTile tone="lav" size="sm">
                <CarTaxiFront size={16} />
              </IconTile>
            }
            hotelId={tonight.id}
            label={t(trip ? 'useful.taxiTonight' : 'useful.taxiFirst')}
            onExpand={() => open({ kind: 'taxi', hotelId: tonight.id })}
            action={
              <button
                type="button"
                className="text-link taxi-more"
                onClick={() => open({ kind: 'hotel', hotelId: tonight.id })}
              >
                {t('useful.aboutHotel')}
              </button>
            }
          />
        </div>

        <section aria-labelledby="phrases-title">
          <SectionTitle id="phrases-title">{t('useful.phrases')}</SectionTitle>
          <div className="phrases">
            {phrases.map((phrase) => (
              <button
                type="button"
                key={phrase.id}
                className="phrase reveal-item"
                onClick={() => open({ kind: 'phrase', phraseId: phrase.id })}
              >
                <span className="phrase-text">
                  <span>{phrase.meaning[lang]}</span>
                  <small className="muted">{phrase.reading[lang]}</small>
                </span>
                <span className="jp phrase-jp" lang="ja">
                  {phrase.ja}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="action-list useful-offline">
        <OfflineSave />
      </div>
    </div>
  );
}
