-- Wrong codes are counted per address (CF-Connecting-IP), so one stranger can't lock us both out.
CREATE TABLE failures (address TEXT PRIMARY KEY, count INTEGER NOT NULL, since INTEGER NOT NULL);
DELETE FROM meta WHERE key = 'failures';
