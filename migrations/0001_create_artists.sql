-- Migration number: 0001 	 2026-07-21T10:03:13.485Z

-- Migration 0001: artists and their translations

CREATE TABLE artists (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  slug               TEXT    NOT NULL UNIQUE,
  display_name       TEXT    NOT NULL,
  role               TEXT    NOT NULL CHECK (role IN ('tattoo', 'piercing', 'both')),
  email              TEXT    NOT NULL,
  instagram_handle   TEXT,
  profile_image_key  TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  is_active          INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE artist_translations (
  artist_id    INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  locale       TEXT    NOT NULL CHECK (locale IN ('en', 'lt')),
  bio          TEXT    NOT NULL,
  bio_excerpt  TEXT,
  PRIMARY KEY (artist_id, locale)
);

CREATE INDEX idx_artists_active_sort ON artists (is_active, sort_order);