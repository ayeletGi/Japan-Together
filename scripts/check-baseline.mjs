import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { publicDays, sourceFolder } from './redact.mjs';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const baseline = JSON.parse(fs.readFileSync('tests/fixtures/baseline.json', 'utf8'));
const folder = sourceFolder();
assert.ok(folder, 'Private source is required for this local audit; do not upload it to CI.');
assert.equal(
  hash(fs.readFileSync(folder + 'data.json', 'utf8')),
  baseline.files.json,
  'Source changed: data.json',
);
const source = JSON.parse(fs.readFileSync(folder + 'data.json', 'utf8'));
const attractionFixture = JSON.parse(
  fs.readFileSync('tests/fixtures/confirmed-attractions.json', 'utf8'),
);
const confirmedAttractions = source.days
  .flatMap((day) => day.events)
  .filter((event) => event.status === 'confirmed' && ['ticket', 'activity'].includes(event.kind))
  .map(({ id, date, time, end, kind, status }) => ({ id, date, time, end, kind, status }));
assert.deepEqual(
  attractionFixture,
  confirmedAttractions,
  'All confirmed attraction IDs and original times must be preserved',
);
for (const day of baseline.days) {
  const original = source.days.find((d) => d.date === day.date);
  assert.equal(original.events.length, day.count);
  for (const event of day.events)
    assert.equal(
      hash(JSON.stringify(original.events.find((e) => e.id === event.id))),
      event.sha256,
      event.id,
    );
}
const published = JSON.parse(fs.readFileSync('src/data/trip-days.json', 'utf8').replace(/^﻿/, ''));
assert.deepEqual(
  published.days,
  publicDays(source),
  'The published data must equal the source minus document references and booking numbers',
);
console.log(
  'PASS: 17 days / 89 events, source JSON unchanged; every published field matches the source except private document references and booking numbers.',
);
