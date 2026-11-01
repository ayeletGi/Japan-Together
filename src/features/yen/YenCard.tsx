import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { IconTile } from '../../components/IconTile';
import { formatDotted } from '../../lib/dates';
import { parseAmount, useYenRate } from './rate';
import './yen.css';

const quickAmounts = [500, 1000, 5000, 10000];

const yenFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const shekelFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** Yen ↔ shekel: type in either field and the other follows, at the freshest rate available. */
export function YenCard() {
  const { t } = useTranslation();
  const { rate, status, refresh } = useYenRate();
  // Which field was typed in last; the other one is derived from it.
  const [input, setInput] = useState<{ side: 'jpy' | 'ils'; text: string }>({
    side: 'jpy',
    text: '1000',
  });

  const typed = parseAmount(input.text);
  const yen =
    input.side === 'jpy'
      ? input.text
      : typed === null
        ? ''
        : yenFormat.format(typed / rate.ilsPerJpy);
  const shekels =
    input.side === 'ils'
      ? input.text
      : typed === null
        ? ''
        : shekelFormat.format(typed * rate.ilsPerJpy);

  return (
    <Card ears className="yen-card" aria-labelledby="yen-title">
      <div className="yen-head">
        <h2 id="yen-title" className="card-head">
          <IconTile tone="pink" size="sm">
            <b className="num">¥</b>
          </IconTile>
          {t('yen.title')}
        </h2>
        <button
          type="button"
          className="yen-refresh"
          onClick={refresh}
          disabled={status === 'loading'}
          aria-label={t('yen.refresh')}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="yen-fields" dir="ltr">
        <label className="yen-input">
          <b aria-hidden="true">¥</b>
          <input
            inputMode="decimal"
            autoComplete="off"
            aria-label={t('yen.yen')}
            value={yen}
            onChange={(event) => setInput({ side: 'jpy', text: event.target.value })}
            onFocus={(event) => event.target.select()}
          />
        </label>
        <span className="yen-equals" aria-hidden="true">
          =
        </span>
        <label className="yen-input yen-input--ils">
          <b aria-hidden="true">₪</b>
          <input
            inputMode="decimal"
            autoComplete="off"
            aria-label={t('yen.shekels')}
            value={shekels}
            onChange={(event) => setInput({ side: 'ils', text: event.target.value })}
            onFocus={(event) => event.target.select()}
          />
        </label>
      </div>
      <div className="yen-quick" role="group" aria-label={t('yen.quick')}>
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            className="yen-chip num"
            aria-pressed={input.side === 'jpy' && typed === amount}
            onClick={() => setInput({ side: 'jpy', text: String(amount) })}
          >
            <bdi>¥{yenFormat.format(amount)}</bdi>
          </button>
        ))}
      </div>
      <p className="yen-rate muted" aria-live="polite">
        <bdi dir="ltr">¥1,000 ≈ ₪{shekelFormat.format(1000 * rate.ilsPerJpy)}</bdi> ·{' '}
        {status === 'loading'
          ? t('yen.loading')
          : t(`yen.source.${rate.source}`, { date: formatDotted(rate.date) })}
      </p>
    </Card>
  );
}
