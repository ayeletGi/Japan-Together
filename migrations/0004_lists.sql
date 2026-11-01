-- Our shared lists (before the flight, to pack, gifts, our own), see src/features/lists/lists.ts.
-- Lists added, renamed or removed, by list id.
CREATE TABLE lists (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
-- Items added, ticked, edited or removed, by item id (`flight.<id>` for the built-in checklist).
CREATE TABLE list_items (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
