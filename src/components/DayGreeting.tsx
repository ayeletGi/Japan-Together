import { useTranslation } from 'react-i18next';
import { japanGreeting } from '../lib/time';
import './DayGreeting.css';

const WORD_STEP_MS = 180;

/**
 * A small grey greeting for the hour in Japan. The words drift in one by one, then a kaomoji face
 * hops in once. Keyed by the greeting period, so it replays only when the period changes.
 */
export function DayGreeting({ now }: { now: Date }) {
  const { t } = useTranslation();
  const greeting = japanGreeting(now);
  const text = t(`time.greeting.${greeting.period}`);
  const words = text.split(' ');
  return (
    <p className="day-greeting">
      <span className="visually-hidden">{text}</span>
      {words.map((word, i) => (
        <span
          key={`${greeting.period}-${i}`}
          className="greeting-word"
          aria-hidden="true"
          style={{ animationDelay: `${i * WORD_STEP_MS}ms` }}
        >
          {word}{' '}
        </span>
      ))}
      <span
        key={`${greeting.period}-face`}
        dir="ltr"
        aria-hidden="true"
        className="greeting-face"
        style={{ animationDelay: `${words.length * WORD_STEP_MS + 100}ms` }}
      >
        {greeting.face}
      </span>
    </p>
  );
}
