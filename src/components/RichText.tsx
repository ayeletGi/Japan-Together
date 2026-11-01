import { Fragment, type ReactNode } from 'react';

/** Time and number ranges ("10:00–10:30", "3–5", "18°–11°") that RTL text would flip. */
const RANGE =
  /(\d{1,2}[:.]\d{2}\s*[–-]\s*\d{1,2}[:.]\d{2}|\d+(?:[.,]\d+)?°?\s*[–-]\s*\d+(?:[.,]\d+)?°?)/g;

/** Keeps every range in left-to-right order inside Hebrew text. */
function isolateRanges(text: string, keyPrefix: string): ReactNode[] {
  return text.split(RANGE).map((part, index) =>
    index % 2 === 1 ? (
      <bdi key={`${keyPrefix}-${index}`} dir="ltr" className="range">
        {part}
      </bdi>
    ) : (
      <Fragment key={`${keyPrefix}-${index}`}>{part}</Fragment>
    ),
  );
}

/**
 * Trip text from the source notes: **bold** becomes <strong> (never raw HTML), and time or number
 * ranges stay in reading order inside Hebrew.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index}>{isolateRanges(part, String(index))}</strong>
        ) : (
          <Fragment key={index}>{isolateRanges(part, String(index))}</Fragment>
        ),
      )}
    </>
  );
}
