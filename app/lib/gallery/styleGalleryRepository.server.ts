// app/lib/gallery/styleGalleryRepository.server.ts

/**
 * D1 access for the /tattoostyles page. Unlike gallery_placements, there is
 * no curation step here — every artist_photos row that carries a `style`
 * tag qualifies, from every active artist. Display order within a style is
 * `style_sort_order`, a column dedicated to this page (see migration 0007)
 * so the monthly reshuffle never touches an artist's own portfolio order
 * (artist_photos.sort_order).
 */

/** One style-tagged photo, joined with enough artist context for the lightbox. */
export type StyleGalleryPhoto = {
  photoId: number;
  style: string;
  objectKey: string;
  width: number;
  height: number;
  artistId: number;
  artistSlug: string;
  artistDisplayName: string;
};

type StyleGalleryPhotoRow = {
  id: number;
  style: string;
  object_key: string;
  width: number;
  height: number;
  artist_id: number;
  artist_slug: string;
  artist_display_name: string;
};

const SELECT_STYLE_GALLERY_PHOTOS_SQL = `
  SELECT
    artist_photos.id                     AS id,
    artist_photos.style                  AS style,
    artist_photos.object_key             AS object_key,
    artist_photos.width                  AS width,
    artist_photos.height                 AS height,
    artists.id                           AS artist_id,
    artists.slug                         AS artist_slug,
    artists.display_name                 AS artist_display_name
  FROM artist_photos
  JOIN artists ON artists.id = artist_photos.artist_id
  WHERE artist_photos.style IS NOT NULL
    AND artists.is_active = 1
  ORDER BY artist_photos.style ASC,
           COALESCE(artist_photos.style_sort_order, artist_photos.sort_order) ASC,
           artist_photos.id ASC
`;

/**
 * Every style-tagged photo from every active artist, in display order. No
 * per-style cap and no curation step — "no curation" means the page shows
 * everything tagged, not a hand-picked subset. The caller groups the flat
 * result by `style`.
 *
 * `style_sort_order` starts NULL for every row until the first monthly
 * shuffle runs; COALESCE falls back to the artist's own `sort_order` so the
 * page has a stable (if unshuffled) order from the moment photos are tagged.
 */
export async function findStyleGalleryPhotos({
  database,
}: {
  database: D1Database;
}): Promise<StyleGalleryPhoto[]> {
  const queryResult = await database
    .prepare(SELECT_STYLE_GALLERY_PHOTOS_SQL)
    .all<StyleGalleryPhotoRow>();

  return queryResult.results.map((row) => ({
    photoId: row.id,
    style: row.style,
    objectKey: row.object_key,
    width: row.width,
    height: row.height,
    artistId: row.artist_id,
    artistSlug: row.artist_slug,
    artistDisplayName: row.artist_display_name,
  }));
}

const UPDATE_STYLE_SORT_ORDER_SQL = `
  UPDATE artist_photos
  SET style_sort_order = ?
  WHERE id = ?
`;

/**
 * Rewrites style_sort_order for every photo across every style group in one
 * atomic batch. Each group is dense-numbered independently — (index + 1) * 10
 * within its own style — the same 10/20/30 spacing convention as
 * rewriteArtistPhotoSortOrder and rewriteGalleryPlacementSortOrder.
 *
 * All groups go into a single database.batch() call so a reshuffle either
 * lands completely or not at all; a half-written shuffle would leave some
 * styles reordered and others not, with no way to tell from the page alone.
 */
export async function rewriteStyleGallerySortOrder({
  database,
  photoIdsByStyle,
  sortOrderIncrement,
}: {
  database: D1Database;
  photoIdsByStyle: ReadonlyMap<string, readonly number[]>;
  sortOrderIncrement: number;
}): Promise<void> {
  const updateStatement = database.prepare(UPDATE_STYLE_SORT_ORDER_SQL);

  const batch = Array.from(photoIdsByStyle.values()).flatMap((photoIds) =>
    photoIds.map((photoId, index) => {
      const nextSortOrder = (index + 1) * sortOrderIncrement;
      return updateStatement.bind(nextSortOrder, photoId);
    }),
  );

  if (batch.length === 0) {
    return;
  }

  await database.batch(batch);
}
