-- Changes saved together (moving a stop swaps two times) share a batch id, so one undo reverts them all.
ALTER TABLE history ADD COLUMN batch TEXT;
