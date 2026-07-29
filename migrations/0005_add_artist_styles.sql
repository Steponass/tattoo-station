-- Migration number: 0005 	 2026-07-29T10:22:01.424Z
-- Display-only, English-only style labels for an artist, stored as a JSON array
-- of strings (e.g. '["Blackwork","Fine line"]'). Nullable: an artist may list none.
ALTER TABLE artists ADD COLUMN styles TEXT;