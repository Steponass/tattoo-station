-- 0007_artist_photo_style_sort_order.sql
--
-- Adds a dedicated ordering column for the /tattoostyles page's monthly
-- reshuffle. artist_photos.sort_order already drives each artist's own
-- portfolio drag-reorder (admin /me/photos, /admin/artists/:id/photos and
-- /flash); reusing it for the style-gallery shuffle would silently scramble
-- an artist's curated portfolio order every month. This column is written
-- only by the monthly cron (shuffleStyleGalleryOrder) and read only by the
-- /tattoostyles loader, so the two orderings never collide.
--
-- Nullable: existing rows start NULL and the style-gallery query falls back
-- to COALESCE(style_sort_order, sort_order) until the first shuffle run
-- seeds real values.

ALTER TABLE artist_photos ADD COLUMN style_sort_order INTEGER;
