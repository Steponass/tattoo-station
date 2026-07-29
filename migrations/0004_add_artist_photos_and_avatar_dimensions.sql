CREATE TABLE artist_photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id   INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  object_key  TEXT    NOT NULL UNIQUE,   -- masters/{slug}/{imageId}.jpg
  category    TEXT    NOT NULL CHECK (category IN ('tattoo', 'piercing', 'flash')),
  width       INTEGER NOT NULL,
  height      INTEGER NOT NULL,
  style       TEXT,                      -- nullable; validated against ARTIST_STYLES at write time
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL
);

CREATE INDEX idx_artist_photos_artist_sort ON artist_photos (artist_id, sort_order);
CREATE INDEX idx_artist_photos_category    ON artist_photos (artist_id, category);

ALTER TABLE artists ADD COLUMN profile_image_width  INTEGER;
ALTER TABLE artists ADD COLUMN profile_image_height INTEGER;