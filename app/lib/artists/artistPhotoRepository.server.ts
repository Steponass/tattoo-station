// app/lib/artists/artistPhotoRepository.server.ts

import {
  mainPhotoCategoryForRole,
  type ArtistPhotoCategory,
} from "./artistPhotoCategories";

/** A stored portfolio photo, mapped to camelCase. `objectKey` is turned into a
 * delivery URL by the view layer, not here — the repository stays URL-agnostic. */
export type ArtistPhotoRecord = {
  id: number;
  objectKey: string;
  category: ArtistPhotoCategory;
  width: number;
  height: number;
  style: string | null;
};

type ArtistPhotoDbRow = {
  id: number;
  object_key: string;
  category: string;
  width: number;
  height: number;
  style: string | null;
};

const SELECT_ARTIST_PHOTOS_SQL = `
  SELECT id, object_key, category, width, height, style
  FROM artist_photos
  WHERE artist_id = ?
  ORDER BY sort_order ASC, id ASC
`;

/** Minimal artist identity needed to build a portfolio object key. */
export type ArtistKeyIdentity = {
  id: number;
  slug: string;
};

/** Aggregate state used to enforce the per-artist cap and to append in order. */
export type ArtistPhotoSummary = {
  count: number;
  maxSortOrder: number;
};

const SELECT_ARTIST_KEY_IDENTITY_SQL = `
  SELECT id, slug
  FROM artists
  WHERE id = ?
`;

const SUMMARIZE_ARTIST_PHOTOS_SQL = `
  SELECT
    COUNT(*)                     AS count,
    COALESCE(MAX(sort_order), 0) AS max_sort_order
  FROM artist_photos
  WHERE artist_id = ?
`;

const INSERT_ARTIST_PHOTO_SQL = `
  INSERT INTO artist_photos
    (artist_id, object_key, category, width, height, style, sort_order, created_at)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?)
`;

/**
 * Resolves the slug for an artist id, or null when no such artist exists.
 *
 * The slug is required to build the object key, and confirming existence here
 * means the endpoint never writes a photo row pointing at a missing artist.
 */
export async function findArtistKeyIdentity({
  database,
  artistId,
}: {
  database: D1Database;
  artistId: number;
}): Promise<ArtistKeyIdentity | null> {
  const row = await database
    .prepare(SELECT_ARTIST_KEY_IDENTITY_SQL)
    .bind(artistId)
    .first<{ id: number; slug: string }>();

  if (row === null) {
    return null;
  }

  return { id: row.id, slug: row.slug };
}

/**
 * Returns the current photo count and highest sort_order for an artist.
 *
 * One query serves two needs: enforcing the per-artist cap, and appending the
 * next photo after the current last one.
 */
export async function summarizeArtistPhotos({
  database,
  artistId,
}: {
  database: D1Database;
  artistId: number;
}): Promise<ArtistPhotoSummary> {
  const row = await database
    .prepare(SUMMARIZE_ARTIST_PHOTOS_SQL)
    .bind(artistId)
    .first<{ count: number; max_sort_order: number }>();

  // Aggregate queries always return a row, but the type is nullable, so default
  // defensively rather than assert non-null.
  return {
    count: row?.count ?? 0,
    maxSortOrder: row?.max_sort_order ?? 0,
  };
}

export async function insertArtistPhoto({
  database,
  artistId,
  objectKey,
  category,
  width,
  height,
  style,
  sortOrder,
  createdAt,
}: {
  database: D1Database;
  artistId: number;
  objectKey: string;
  category: ArtistPhotoCategory;
  width: number;
  height: number;
  style: string | null;
  sortOrder: number;
  createdAt: string;
}): Promise<{ id: number }> {
  const result = await database
    .prepare(INSERT_ARTIST_PHOTO_SQL)
    .bind(artistId, objectKey, category, width, height, style, sortOrder, createdAt)
    .run();

  const insertedRowId = result.meta.last_row_id;

  if (typeof insertedRowId !== "number") {
    // D1 returns last_row_id as a number for successful INSERTs against
    // integer primary keys. If it's absent, something has gone weirdly
    // wrong with the driver — throw rather than pretend the write worked.
    throw new Error("insertArtistPhoto: D1 did not return last_row_id");
  }

  return { id: insertedRowId };
}

/**
 * Returns all of an artist's photos in display order. The caller groups by
 * category — one query covers every tab rather than one query per tab.
 */
export async function findArtistPhotos({
  database,
  artistId,
}: {
  database: D1Database;
  artistId: number;
}): Promise<ArtistPhotoRecord[]> {
  const queryResult = await database
    .prepare(SELECT_ARTIST_PHOTOS_SQL)
    .bind(artistId)
    .all<ArtistPhotoDbRow>();

  return queryResult.results.map((row) => ({
    id: row.id,
    objectKey: row.object_key,
    // Values are constrained by the table's category CHECK, so the cast is safe.
    category: row.category as ArtistPhotoCategory,
    width: row.width,
    height: row.height,
    style: row.style,
  }));
}

const SELECT_ARTIST_PHOTOS_BY_CATEGORY_SQL = `
  SELECT id, object_key, category, width, height, style
  FROM artist_photos
  WHERE artist_id = ? AND category = ?
  ORDER BY sort_order ASC, id ASC
`;

/**
 * Returns one artist's photos in a single category, in display order.
 *
 * The admin editor grids (main-photo and flash) each show exactly one
 * category. Filtering in SQL rather than pulling all photos and filtering
 * in JS matches how the site reads them at display time and keeps the row
 * count bounded to the surface being edited.
 */
export async function findArtistPhotosByCategory({
  database,
  artistId,
  category,
}: {
  database: D1Database;
  artistId: number;
  category: ArtistPhotoCategory;
}): Promise<ArtistPhotoRecord[]> {
  const queryResult = await database
    .prepare(SELECT_ARTIST_PHOTOS_BY_CATEGORY_SQL)
    .bind(artistId, category)
    .all<ArtistPhotoDbRow>();

  return queryResult.results.map((row) => ({
    id: row.id,
    objectKey: row.object_key,
    category: row.category as ArtistPhotoCategory,
    width: row.width,
    height: row.height,
    style: row.style,
  }));
}

/**
 * One photo as the roster teaser needs it. Carries `artistId` because a single
 * query returns every artist's preview photos together; the caller groups on it.
 */
export type RosterPreviewPhotoRecord = {
  id: number;
  artistId: number;
  objectKey: string;
  width: number;
  height: number;
};

type RosterPreviewPhotoRow = {
  id: number;
  artist_id: number;
  object_key: string;
  width: number;
  height: number;
};

/**
 * The first N photos of every active artist, each in that artist's own
 * gallery order.
 *
 * ROW_NUMBER() ... PARTITION BY keeps the whole roster to one query rather
 * than one query per artist: the subquery numbers each artist's photos
 * independently and the outer WHERE clips every artist to the same limit. The
 * result set is bounded by (artists × N), not by the per-artist portfolio cap,
 * so a well-stocked portfolio costs the roster nothing.
 *
 * Only the artist's main category is previewed — tattoo work for tattooists,
 * piercing work for piercers — so the teaser matches the gallery they curate
 * at /admin/me/photos. Flash is deliberately excluded: it is separate work
 * with its own page. The two category names are bound rather than written
 * inline so `mainPhotoCategoryForRole` stays the single source of that mapping.
 */
const SELECT_ROSTER_PREVIEW_PHOTOS_SQL = `
  SELECT id, artist_id, object_key, width, height
  FROM (
    SELECT
      artist_photos.id         AS id,
      artist_photos.artist_id  AS artist_id,
      artist_photos.object_key AS object_key,
      artist_photos.width      AS width,
      artist_photos.height     AS height,
      ROW_NUMBER() OVER (
        PARTITION BY artist_photos.artist_id
        ORDER BY artist_photos.sort_order ASC, artist_photos.id ASC
      )                        AS rank_in_artist
    FROM artist_photos
    JOIN artists ON artists.id = artist_photos.artist_id
    WHERE artists.is_active = 1
      AND artist_photos.category =
        CASE artists.role WHEN 'piercing' THEN ? ELSE ? END
  )
  WHERE rank_in_artist <= ?
  ORDER BY artist_id ASC, rank_in_artist ASC
`;

export async function findRosterPreviewPhotos({
  database,
  photosPerArtist,
}: {
  database: D1Database;
  photosPerArtist: number;
}): Promise<RosterPreviewPhotoRecord[]> {
  const queryResult = await database
    .prepare(SELECT_ROSTER_PREVIEW_PHOTOS_SQL)
    .bind(
      mainPhotoCategoryForRole("piercing"),
      mainPhotoCategoryForRole("tattoo"),
      photosPerArtist,
    )
    .all<RosterPreviewPhotoRow>();

  return queryResult.results.map((row) => ({
    id: row.id,
    artistId: row.artist_id,
    objectKey: row.object_key,
    width: row.width,
    height: row.height,
  }));
}

const UPDATE_ARTIST_PHOTO_SORT_ORDER_SQL = `
  UPDATE artist_photos
  SET sort_order = ?
  WHERE id = ?
`;

/**
 * Rewrites the sort_order on a list of photos in a single atomic batch.
 *
 * D1's `batch()` runs all statements inside one implicit transaction — either
 * every row's sort_order updates, or none do. That's the property we need:
 * the reorder service treats "rewrite the whole list" as an atomic operation,
 * because a half-completed reorder would leave the artist looking at an
 * inconsistent order and would fail the next reorder's set-exact-match
 * validation.
 *
 * Ownership is not checked here. The caller has already verified that every
 * id in the list belongs to `artistId` in the specified category; this
 * function trusts its inputs. Keeping the check up-stack means the repository
 * is one focused concern (write with the sort_order I gave you), and the
 * ownership check runs once at the service boundary rather than once per row.
 */
export async function rewriteArtistPhotoSortOrder({
  database,
  photoIdsInOrder,
  sortOrderIncrement,
}: {
  database: D1Database;
  photoIdsInOrder: readonly number[];
  sortOrderIncrement: number;
}): Promise<void> {
  if (photoIdsInOrder.length === 0) {
    return;
  }

  const updateStatement = database.prepare(UPDATE_ARTIST_PHOTO_SORT_ORDER_SQL);

  const batch = photoIdsInOrder.map((photoId, index) => {
    const nextSortOrder = (index + 1) * sortOrderIncrement;
    return updateStatement.bind(nextSortOrder, photoId);
  });

  await database.batch(batch);
}

const SELECT_ARTIST_PHOTO_FOR_DELETION_SQL = `
  SELECT id, object_key
  FROM artist_photos
  WHERE id = ? AND artist_id = ?
`;

/**
 * Loads the fields needed to delete one photo, scoped by artist. If the id
 * doesn't exist OR belongs to another artist, returns null — the two cases
 * are indistinguishable to the caller, which is the point. The service
 * treats both as "not yours."
 */
export async function findArtistPhotoForDeletion({
  database,
  photoId,
  artistId,
}: {
  database: D1Database;
  photoId: number;
  artistId: number;
}): Promise<{ id: number; objectKey: string } | null> {
  const row = await database
    .prepare(SELECT_ARTIST_PHOTO_FOR_DELETION_SQL)
    .bind(photoId, artistId)
    .first<{ id: number; object_key: string }>();

  if (row === null) {
    return null;
  }

  return { id: row.id, objectKey: row.object_key };
}

const DELETE_ARTIST_PHOTO_SQL = `
  DELETE FROM artist_photos
  WHERE id = ?
`;

/**
 * Deletes a single D1 row by id. No ownership check here — the caller has
 * already verified via `findArtistPhotoForDeletion` that the row belongs to
 * the artist. Adding a redundant `artist_id = ?` on the delete would be
 * belt-and-braces at the cost of a slightly-more-complex query for a check
 * that only fails when the caller made a mistake we can't recover from
 * anyway.
 *
 * `gallery_placements` rows for this photo cascade automatically via the
 * ON DELETE CASCADE foreign key added in step 3's migration.
 */
export async function deleteArtistPhotoRow({
  database,
  photoId,
}: {
  database: D1Database;
  photoId: number;
}): Promise<void> {
  await database.prepare(DELETE_ARTIST_PHOTO_SQL).bind(photoId).run();
}
