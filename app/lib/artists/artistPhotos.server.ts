// app/lib/artists/artistPhotos.server.ts

import { normalizeImage } from "~/lib/images/normalizeImage.server";
import { PORTFOLIO_MAX_EDGE_PIXELS } from "~/lib/images/imageConstants";
import { buildPortfolioMasterKey } from "~/lib/media/mediaKeys";
import {
  findArtistKeyIdentity,
  insertArtistPhoto,
  summarizeArtistPhotos,
} from "./artistPhotoRepository.server";
import type { ArtistStyle } from "./artistStyles";
import type { ArtistPhotoCategory } from "./artistPhotoCategories";
/**
 * Per-artist portfolio cap. Bounds storage cost and forces curation — a wall of
 * 200 photos serves neither the artist nor the visitor. Raise deliberately.
 */
export const MAX_PORTFOLIO_PHOTOS_PER_ARTIST = 50;

/**
 * Gap between sort_order values, matching the seed's 10/20/30 spacing, so a
 * photo can later be reinserted between two others without renumbering.
 */
const SORT_ORDER_INCREMENT = 10;

export type StoreArtistPhotoFailureCode =
  | "artist_not_found"
  | "portfolio_full"
  | "unreadable_image"
  | "unsupported_source_format"
  | "transformation_failed"
  | "storage_failed"
  | "persist_failed";

export type StoredArtistPhoto = {
  objectKey: string;
  width: number;
  height: number;
  byteSize: number;
  sortOrder: number;
};

export type StoreArtistPhotoResult =
  | { ok: true; photo: StoredArtistPhoto }
  | { ok: false; failureCode: StoreArtistPhotoFailureCode; detail: string };

/**
 * Normalizes one uploaded portfolio image, writes the JPEG master to R2, and
 * records it in D1 — the photo's final, persistent state in a single call.
 *
 * Unlike booking photos (staged in R2, persisted to D1 only at submit), a
 * portfolio photo has no draft phase: the upload IS the create.
 *
 * Ordering matters. R2 is written before D1 so a failed persist can be undone
 * by deleting the just-written object; the reverse would leave a D1 row
 * pointing at nothing.
 */
export async function storeArtistPhoto({
  images,
  mediaBucket,
  database,
  artistId,
  category,
  style,
  sourceBytes,
}: {
  images: ImagesBinding;
  mediaBucket: R2Bucket;
  database: D1Database;
  artistId: number;
  category: ArtistPhotoCategory;
  style: ArtistStyle | null;
  sourceBytes: ArrayBuffer;
}): Promise<StoreArtistPhotoResult> {
  const artist = await findArtistKeyIdentity({ database, artistId });

  if (artist === null) {
    return {
      ok: false,
      failureCode: "artist_not_found",
      detail: `No artist exists with id ${artistId}.`,
    };
  }

  const summary = await summarizeArtistPhotos({ database, artistId });

  if (summary.count >= MAX_PORTFOLIO_PHOTOS_PER_ARTIST) {
    return {
      ok: false,
      failureCode: "portfolio_full",
      detail: `Artist already has the maximum of ${MAX_PORTFOLIO_PHOTOS_PER_ARTIST} photos.`,
    };
  }

  const normalizeResult = await normalizeImage({
    images,
    sourceBytes,
    maxEdgePixels: PORTFOLIO_MAX_EDGE_PIXELS,
  });

  if (!normalizeResult.ok) {
    return {
      ok: false,
      failureCode: normalizeResult.failureCode,
      detail: normalizeResult.detail,
    };
  }

  const { bytes, contentType, width, height, byteSize } = normalizeResult.image;
  const objectKey = buildPortfolioMasterKey({
    artistSlug: artist.slug,
    imageId: crypto.randomUUID(),
  });

  try {
    await mediaBucket.put(objectKey, bytes, {
      httpMetadata: { contentType },
      customMetadata: {
        width: String(width),
        height: String(height),
      },
    });
  } catch (error) {
    return {
      ok: false,
      failureCode: "storage_failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  const sortOrder = summary.maxSortOrder + SORT_ORDER_INCREMENT;

  try {
    await insertArtistPhoto({
      database,
      artistId,
      category,
      objectKey,
      width,
      height,
      style,
      sortOrder,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // Compensate for the orphaned master so a failed insert doesn't leak an
    // unreferenced object into R2. Cleanup failure must not mask the original.
    await mediaBucket.delete(objectKey).catch(() => {});

    return {
      ok: false,
      failureCode: "persist_failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    ok: true,
    photo: { objectKey, width, height, byteSize, sortOrder },
  };
}