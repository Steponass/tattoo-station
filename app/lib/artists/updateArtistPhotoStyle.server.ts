// app/lib/artists/updateArtistPhotoStyle.server.ts

import { updateArtistPhotoStyleRow } from "./artistPhotoRepository.server";
import type { ArtistStyle } from "./artistStyles";

/**
 * Changes the style tag on one already-uploaded photo. Ownership is enforced
 * by the repository's `artist_id` scoping, same pattern as
 * `deleteArtistPhoto.server.ts`: a photo id that doesn't exist or belongs to
 * another artist resolves to the same "photo_not_found" failure, so callers
 * can't enumerate ids.
 */

export type UpdateArtistPhotoStyleFailureCode =
  | "photo_not_found"
  | "d1_update_failed";

export type UpdateArtistPhotoStyleResult =
  | { ok: true }
  | {
      ok: false;
      failureCode: UpdateArtistPhotoStyleFailureCode;
      detail: string;
    };

export type UpdateArtistPhotoStyleInput = {
  database: D1Database;
  artistId: number;
  photoId: number;
  style: ArtistStyle | null;
};

export async function updateArtistPhotoStyle(
  input: UpdateArtistPhotoStyleInput,
): Promise<UpdateArtistPhotoStyleResult> {
  const { database, artistId, photoId, style } = input;

  try {
    const { updated } = await updateArtistPhotoStyleRow({
      database,
      photoId,
      artistId,
      style,
    });

    if (!updated) {
      return {
        ok: false,
        failureCode: "photo_not_found",
        detail: "Photo does not exist or does not belong to this artist.",
      };
    }

    return { ok: true };
  } catch (updateError) {
    console.error("[updateArtistPhotoStyle] D1 update failed:", updateError);
    return {
      ok: false,
      failureCode: "d1_update_failed",
      detail: "Could not update the style. Please try again.",
    };
  }
}
