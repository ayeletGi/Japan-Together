// Local only: regenerates src/data/trip-days.json from the private source in the sibling folder.
// Drops document references and booking numbers; every other field is copied unchanged.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { LEFTOVER_REFERENCE, publicDays, sourceFolder } from './redact.mjs';

const folder = sourceFolder();
assert.ok(folder, 'Private source is required; this script never runs in CI.');

const source = JSON.parse(fs.readFileSync(folder + 'data.json', 'utf8'));
const days = publicDays(source);

let redacted = 0;
source.days.forEach((day, d) =>
  day.events.forEach((event, e) => {
    const note = days[d].events[e].note;
    assert.ok(!LEFTOVER_REFERENCE.test(note), `Reference left in ${event.id}: review the rules`);
    if (note !== event.note) redacted++;
  }),
);

fs.writeFileSync('src/data/trip-days.json', JSON.stringify({ days }, null, 2) + '\n');
console.log(
  `Wrote ${days.length} days / ${days.flatMap((d) => d.events).length} events; ` +
    `${redacted} notes had booking references removed.`,
);
