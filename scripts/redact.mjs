// Redaction rules shared by sync-source (writes the public data) and check-baseline (verifies it).
// Rules are patterns, never literal values: the private references themselves must not live in Git.
import fs from 'node:fs';

/** The private source folder next to the project (`original-plan`), or undefined. */
export function sourceFolder() {
  return fs.existsSync('../original-plan/data.json') ? '../original-plan/' : undefined;
}

/** Booking / confirmation references inside free-text notes, plus the punctuation around them. */
const REFERENCE = String.raw`מספר (?:הזמנה|אישור)\s+[A-Za-z0-9_]+`;

const rules = [
  // "מספר הזמנה 1234 · קרון 14" → "קרון 14"
  [new RegExp(`^${REFERENCE}\\s*·\\s*`), ''],
  // "10E; מספר הזמנה 1234. לצורך" → "10E. לצורך"
  [new RegExp(`;\\s*${REFERENCE}`, 'g'), ''],
  // "(שער 12.10) מספר הזמנה X. איחור" → "(שער 12.10). איחור"
  [new RegExp(`(?<=\\))\\s*${REFERENCE}\\.`, 'g'), '.'],
  // "מובטח. מספר הזמנה X. | שעות" → "מובטח. | שעות"
  [new RegExp(`\\s*${REFERENCE}\\.?`, 'g'), ''],
];

export const LEFTOVER_REFERENCE = /מספר (?:הזמנה|אישור)\s*[:#]?\s*[A-Za-z0-9_]{3,}/;

function redactNote(note) {
  let result = note;
  for (const [pattern, replacement] of rules) result = result.replace(pattern, replacement);
  return result;
}

/** Fields that never leave the private source. */
const PRIVATE_FIELDS = ['docs'];

function publicEvent(event) {
  const copy = { ...event };
  for (const field of PRIVATE_FIELDS) delete copy[field];
  copy.note = redactNote(copy.note);
  // Source tags end with the plan's version number; the app only needs the kind of source.
  copy.source = copy.source.replace(/-v\d+$/, '');
  return copy;
}

export function publicDays(source) {
  return source.days.map((day) => ({ ...day, events: day.events.map(publicEvent) }));
}
