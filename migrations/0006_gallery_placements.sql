-- 0006_gallery_placements.sql
--
-- Introduces the gallery_placements table, which backs the two admin-curated
-- cross-artist showcases: the landing-page gallery and the /flash page.
--
-- A row = one photo placed in one gallery. The primary key on photo_id alone
-- enforces mutual exclusion at the schema layer: a photo can appear in at
-- most one gallery at a time. This is a departure from the initial handoff
-- (which specified PRIMARY KEY (gallery, photo_id) allowing dual placement),
-- adopted so the DB is the source of truth for the "photo lives on one
-- surface" invariant rather than trusting the service to enforce it.
--
-- ON DELETE CASCADE on photo_id means removing an artist_photo automatically
-- removes its placement; nothing in the app has to sweep placements on delete.

CREATE TABLE gallery_placements (
  photo_id   INTEGER NOT NULL PRIMARY KEY REFERENCES artist_photos(id) ON DELETE CASCADE,
  gallery    TEXT    NOT NULL CHECK (gallery IN ('landing', 'flash')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- The ordered read: "photos placed in gallery X, in display order." Both the
-- public /flash page and the /admin/landing/flash curation UIs use this. The
-- primary key already indexes photo_id; this index makes the (gallery,
-- sort_order) filter+order path index-only.
CREATE INDEX idx_gallery_placements_gallery_sort_order
  ON gallery_placements (gallery, sort_order);