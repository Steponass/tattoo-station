// app/lib/gallery/galleryPlacementRepository.server.ts

/**
 * D1 access for the gallery_placements table. Category-agnostic curation —
 * both the landing-page gallery and the /flash page are backed here, keyed
 * only by the `gallery` column.
 *
 * The table's primary key on `photo_id` alone enforces mutual exclusion at
 * the schema layer: a photo can be placed in at most one gallery. That
 * constraint means an INSERT attempt for an already-placed photo raises a
 * SQLite UNIQUE violation; callers translate that into a
 * "already_placed_in_other_gallery" user-facing error.
 *
 * ON DELETE CASCADE on the FK to artist_photos means removing a photo
 * (via the artist's delete flow) auto-removes its placement — this module
 * has no manual cascade responsibility.
 */

/**
 * The two galleries the admin curates. Discriminated string union so the
 * service and endpoint can pattern-match rather than string-compare
 * throughout.
 */
export type GalleryName = "landing" | "flash";

/**
 * Guard for accepting a gallery from JSON envelopes. The service uses
 * `GalleryName` as a compile-time contract; this function turns runtime
 * strings into that contract or rejects them.
 */
export function isGalleryName(candidate: unknown): candidate is GalleryName {
  return candidate === "landing" || candidate === "flash";
}

/**
 * The shape returned to the curator's "placed in this gallery" pane. Combines
 * the placement (sort_order) with enough of the artist_photos row to render
 * the tile: object key for the image URL, width and height for CLS-free
 * layout, category and (indirectly) artist context if we later want it.
 */
export type PlacedPhoto = {
  photoId: number;
  objectKey: string;
  width: number;
  height: number;
  category: "tattoo" | "piercing" | "flash";
  artistId: number;
  artistSlug: string;
  artistDisplayName: string;
  sortOrder: number;
};

type PlacedPhotoRow = {
  photo_id: number;
  object_key: string;
  width: number;
  height: number;
  category: "tattoo" | "piercing" | "flash";
  artist_id: number;
  artist_slug: string;
  artist_display_name: string;
  sort_order: number;
};

const SELECT_PLACED_PHOTOS_SQL = `
  SELECT
    gallery_placements.photo_id                    AS photo_id,
    artist_photos.object_key                       AS object_key,
    artist_photos.width                            AS width,
    artist_photos.height                           AS height,
    artist_photos.category                         AS category,
    artist_photos.artist_id                        AS artist_id,
    artists.slug                                   AS artist_slug,
    artists.display_name                           AS artist_display_name,
    gallery_placements.sort_order                  AS sort_order
  FROM gallery_placements
  JOIN artist_photos ON artist_photos.id = gallery_placements.photo_id
  JOIN artists       ON artists.id       = artist_photos.artist_id
  WHERE gallery_placements.gallery = ?
  ORDER BY gallery_placements.sort_order ASC
`;

/**
 * Returns every photo currently placed in the given gallery, in display order,
 * joined with the artist name for the curator's per-tile "by NAME" label.
 * Used by:
 *   - the admin curation page for that gallery
 *   - the public site (post-migration, in 3.6 and 3.7) — same shape works;
 *     public reads may not need artistDisplayName, but paying two extra
 *     bytes of JOIN result is invisible at these row counts.
 */
export async function findPlacedPhotos({
  database,
  gallery,
}: {
  database: D1Database;
  gallery: GalleryName;
}): Promise<PlacedPhoto[]> {
  const queryResult = await database
    .prepare(SELECT_PLACED_PHOTOS_SQL)
    .bind(gallery)
    .all<PlacedPhotoRow>();

  return queryResult.results.map((row) => ({
    photoId: row.photo_id,
    objectKey: row.object_key,
    width: row.width,
    height: row.height,
    category: row.category,
    artistId: row.artist_id,
    artistSlug: row.artist_slug,
    artistDisplayName: row.artist_display_name,
    sortOrder: row.sort_order,
  }));
}

/**
 * The shape returned to the curator's "available to place" pane. Same as
 * PlacedPhoto minus sortOrder (unplaced photos have no order) and photo_id
 * name — kept as `photoId` for consistency across placed/unplaced.
 */
export type PlaceablePhoto = {
  photoId: number;
  objectKey: string;
  width: number;
  height: number;
  category: "tattoo" | "piercing" | "flash";
  artistId: number;
  artistDisplayName: string;
};

type PlaceablePhotoRow = {
  photo_id: number;
  object_key: string;
  width: number;
  height: number;
  category: "tattoo" | "piercing" | "flash";
  artist_id: number;
  artist_display_name: string;
};

const SELECT_PLACEABLE_PHOTOS_SQL = `
  SELECT
    artist_photos.id           AS photo_id,
    artist_photos.object_key   AS object_key,
    artist_photos.width        AS width,
    artist_photos.height       AS height,
    artist_photos.category     AS category,
    artist_photos.artist_id    AS artist_id,
    artists.display_name       AS artist_display_name
  FROM artist_photos
  LEFT JOIN gallery_placements
    ON gallery_placements.photo_id = artist_photos.id
  JOIN artists
    ON artists.id = artist_photos.artist_id
  WHERE gallery_placements.photo_id IS NULL
  ORDER BY artists.sort_order ASC, artists.display_name ASC,
           artist_photos.sort_order ASC
`;

/**
 * Returns every photo NOT currently placed in any gallery, ordered by artist
 * (roster order, then display name for ties) and then by the artist's own
 * gallery order. This is the pool the curator picks from.
 *
 * The mutual-exclusion rule from schema 0006 means a placed photo appears
 * in exactly one gallery; the LEFT JOIN + IS NULL filter excludes both
 * galleries in one predicate. If mutual exclusion is ever relaxed, this
 * query changes to include a `gallery != ?` predicate.
 *
 * Not filtered by `is_active`. An inactive artist's photos are still
 * curatable — the admin might want to feature retired work. The public site
 * respects `is_active` at display time (roster hides inactive artists, but
 * the curated galleries deliberately don't join against that flag for the
 * same reason).
 */
export async function findPlaceablePhotos({
  database,
}: {
  database: D1Database;
}): Promise<PlaceablePhoto[]> {
  const queryResult = await database
    .prepare(SELECT_PLACEABLE_PHOTOS_SQL)
    .all<PlaceablePhotoRow>();

  return queryResult.results.map((row) => ({
    photoId: row.photo_id,
    objectKey: row.object_key,
    width: row.width,
    height: row.height,
    category: row.category,
    artistId: row.artist_id,
    artistDisplayName: row.artist_display_name,
  }));
}

/**
 * Aggregate query for the placed photos' max sort_order in a gallery. Used at
 * insert time to append at the end without renumbering. Returns 0 for an
 * empty gallery, matching how artist_photos handles the same situation.
 */
const SELECT_MAX_SORT_ORDER_SQL = `
  SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order
  FROM gallery_placements
  WHERE gallery = ?
`;

export async function findMaxSortOrderInGallery({
  database,
  gallery,
}: {
  database: D1Database;
  gallery: GalleryName;
}): Promise<number> {
  const row = await database
    .prepare(SELECT_MAX_SORT_ORDER_SQL)
    .bind(gallery)
    .first<{ max_sort_order: number }>();

  return row?.max_sort_order ?? 0;
}

const INSERT_PLACEMENT_SQL = `
  INSERT INTO gallery_placements (photo_id, gallery, sort_order)
  VALUES (?, ?, ?)
`;

/**
 * Failure codes rather than raw error propagation, so the service can
 * translate UNIQUE-constraint violations into user-facing language ("already
 * placed in the other gallery") without inspecting SQLite error strings.
 */
export type InsertPlacementResult =
  | { ok: true }
  | { ok: false; failureCode: "already_placed" | "persist_failed" };

export async function insertGalleryPlacement({
  database,
  photoId,
  gallery,
  sortOrder,
}: {
  database: D1Database;
  photoId: number;
  gallery: GalleryName;
  sortOrder: number;
}): Promise<InsertPlacementResult> {
  try {
    await database
      .prepare(INSERT_PLACEMENT_SQL)
      .bind(photoId, gallery, sortOrder)
      .run();
    return { ok: true };
  } catch (insertError) {
    // The PK on photo_id means an INSERT for a photo already placed anywhere
    // fails with a UNIQUE-constraint error. Pattern-match on the message
    // shape D1 emits — the error's `.message` includes "UNIQUE constraint
    // failed: gallery_placements.photo_id" for this specific case.
    if (isUniqueConstraintError(insertError)) {
      return { ok: false, failureCode: "already_placed" };
    }
    console.error("[galleryPlacementRepository] insert failed:", insertError);
    return { ok: false, failureCode: "persist_failed" };
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.includes("UNIQUE constraint failed");
}

const DELETE_PLACEMENT_SQL = `
  DELETE FROM gallery_placements WHERE photo_id = ? AND gallery = ?
`;

/**
 * Removes one placement. Returns whether a row was actually matched — the
 * caller uses this to distinguish "removed" from "wasn't there" (which the
 * curation UI treats as success either way, but the endpoint returns
 * different status codes).
 */
export async function deleteGalleryPlacement({
  database,
  photoId,
  gallery,
}: {
  database: D1Database;
  photoId: number;
  gallery: GalleryName;
}): Promise<{ rowMatched: boolean }> {
  const result = await database
    .prepare(DELETE_PLACEMENT_SQL)
    .bind(photoId, gallery)
    .run();

  return { rowMatched: (result.meta.changes ?? 0) > 0 };
}

const UPDATE_PLACEMENT_SORT_ORDER_SQL = `
  UPDATE gallery_placements SET sort_order = ? WHERE photo_id = ? AND gallery = ?
`;

/**
 * Batch-rewrites sort_order for a list of placements. Uses D1's batch() for
 * atomicity — same reasoning as rewriteArtistPhotoSortOrder: a half-
 * completed reorder wedges the gallery.
 *
 * The `gallery` predicate in the UPDATE is defensive: the service has
 * already verified every photoId belongs to the target gallery, but the
 * extra predicate means a service bug that leaks another gallery's id
 * cannot mutate its ordering.
 */
export async function rewriteGalleryPlacementSortOrder({
  database,
  gallery,
  photoIdsInOrder,
  sortOrderIncrement,
}: {
  database: D1Database;
  gallery: GalleryName;
  photoIdsInOrder: readonly number[];
  sortOrderIncrement: number;
}): Promise<void> {
  if (photoIdsInOrder.length === 0) {
    return;
  }

  const updateStatement = database.prepare(UPDATE_PLACEMENT_SORT_ORDER_SQL);

  const batch = photoIdsInOrder.map((photoId, index) => {
    const nextSortOrder = (index + 1) * sortOrderIncrement;
    return updateStatement.bind(nextSortOrder, photoId, gallery);
  });

  await database.batch(batch);
}