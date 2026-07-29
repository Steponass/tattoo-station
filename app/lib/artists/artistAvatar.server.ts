// app/lib/artists/artistAvatar.server.ts

import { normalizeImage } from "~/lib/images/normalizeImage.server";
import { AVATAR_MAX_EDGE_PIXELS } from "~/lib/images/imageConstants";
import { buildArtistAvatarKey } from "~/lib/media/mediaKeys";
import {
  findArtistForAvatarUpdate,
  updateArtistAvatar,
} from "./artistRepository.server";

export type StoreArtistAvatarFailureCode =
  | "artist_not_found"
  | "unreadable_image"
  | "unsupported_source_format"
  | "transformation_failed"
  | "storage_failed"
  | "persist_failed";

export type StoredArtistAvatar = {
  objectKey: string;
  width: number;
  height: number;
  byteSize: number;
};

export type StoreArtistAvatarResult =
  | { ok: true; avatar: StoredArtistAvatar }
  | { ok: false; failureCode: StoreArtistAvatarFailureCode; detail: string };

/**
 * Normalizes an uploaded avatar, writes it to R2 under a fresh key, points the
 * artist row at it, then deletes the previous avatar object.
 *
 * Ordering: put new → repoint row → delete old. A failed repoint deletes the
 * new object and leaves the old avatar intact; the old object is only removed
 * once the row is safely pointing at the new one.
 */
export async function storeArtistAvatar({
  images,
  mediaBucket,
  database,
  artistId,
  sourceBytes,
}: {
  images: ImagesBinding;
  mediaBucket: R2Bucket;
  database: D1Database;
  artistId: number;
  sourceBytes: ArrayBuffer;
}): Promise<StoreArtistAvatarResult> {
  const target = await findArtistForAvatarUpdate({ database, artistId });

  if (target === null) {
    return {
      ok: false,
      failureCode: "artist_not_found",
      detail: `No artist exists with id ${artistId}.`,
    };
  }

  const normalizeResult = await normalizeImage({
    images,
    sourceBytes,
    maxEdgePixels: AVATAR_MAX_EDGE_PIXELS,
  });

  if (!normalizeResult.ok) {
    return {
      ok: false,
      failureCode: normalizeResult.failureCode,
      detail: normalizeResult.detail,
    };
  }

  const { bytes, contentType, width, height, byteSize } = normalizeResult.image;
  const objectKey = buildArtistAvatarKey({
    artistSlug: target.slug,
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

  try {
    await updateArtistAvatar({ database, artistId, objectKey, width, height });
  } catch (error) {
    // Roll back the just-written object so a failed update leaves no orphan and
    // the artist keeps their previous avatar.
    await mediaBucket.delete(objectKey).catch(() => {});

    return {
      ok: false,
      failureCode: "persist_failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  // The row now points at the new object; remove the previous one. Failure here
  // only leaves a stale file behind, so it is logged, not fatal.
  if (target.currentAvatarKey !== null) {
    await mediaBucket.delete(target.currentAvatarKey).catch((error) => {
      console.error(
        "[artist-avatar] failed to delete previous avatar:",
        target.currentAvatarKey,
        error,
      );
    });
  }

  return {
    ok: true,
    avatar: { objectKey, width, height, byteSize },
  };
}