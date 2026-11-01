-- Photos of list items, by photo id (`/api/photo/<id>`, see worker/index.ts). A photo never
-- changes: a new one gets a new id, so phones can keep it for good. Base64, as D1 stores text well.
CREATE TABLE photos (id TEXT PRIMARY KEY, type TEXT NOT NULL, data TEXT NOT NULL, added_at TEXT NOT NULL, added_by TEXT NOT NULL);
