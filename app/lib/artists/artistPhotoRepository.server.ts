// app/lib/artists/artistPhotoRepository.server.ts

import type { ArtistPhotoCategory } from "./artistPhotoCategories";

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
}): Promise<void> {
  await database
    .prepare(INSERT_ARTIST_PHOTO_SQL)
    .bind(artistId, objectKey, category, width, height, style, sortOrder, createdAt)
    .run();
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