-- Changes made after the original plan (see src/data/live.ts). Each table holds one JSON object
-- per key; the app layers them on top of the data in code.

-- Edits to an activity of the plan, by event id.
CREATE TABLE event_changes (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
-- New activities, by id (live-…).
CREATE TABLE added_events (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
-- Edits to a whole day (route, headline, tags), by date.
CREATE TABLE day_changes (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
-- Costs added or edited during the trip, by expense id.
CREATE TABLE expenses (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
-- A Drive photo folder per day, by date.
CREATE TABLE photo_folders (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);

-- Every change, with the value before and after, so it can be undone.
CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  who TEXT NOT NULL,
  kind TEXT NOT NULL,
  key TEXT NOT NULL,
  before TEXT,
  after TEXT,
  why TEXT,
  undone INTEGER NOT NULL DEFAULT 0
);

-- `version` goes up with every change; the app polls it. `failures` counts wrong codes.
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO meta (key, value) VALUES ('version', '0');
