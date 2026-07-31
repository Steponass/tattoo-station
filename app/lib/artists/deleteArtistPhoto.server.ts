// app/lib/artists/deleteArtistPhoto.server.ts

import {
  findArtistPhotoForDeletion,
  deleteArtistPhotoRow,
} from "./artistPhotoRepository.server";

/**
 * Deletes one artist photo. D1 row first, then R2 master. If the R2 delete
 * fails, the D1 row is already gone — the user's action is complete from
 * their perspective, and the orphaned R2 object is invisible (nothing routes
 * to it without a matching D1 row). We log the leak and return success.
 *
 * The alternative (R2 first, D1 second) leaves a D1 row pointing at bytes
 * that no longer exist if D1 fails — broken images in the grid, no way for
 * the artist to fix it themselves. That is a worse failure mode than an
 * invisible R2 leak, so D1-first wins.
 *
 * Ownership is enforced by the D1 read: `findArtistPhotoForDeletion` scopes
 * by both photo id and artist id. A photo id that belongs to another artist
 * (or doesn't exist at all) resolves to null and produces the same
 * "photo_not_found" failure. That's deliberate — leaking the difference
 * between "wrong photo" and "not your photo" would enumerate ids for an
 * attacker.
 */

export type DeleteArtistPhotoFailureCode =
  "photo_not_found" | "d1_delete_failed";

export type DeleteArtistPhotoResult =
  | { ok: true }
  | {
      ok: false;
      failureCode: DeleteArtistPhotoFailureCode;
      detail: string;
    };

export type DeleteArtistPhotoInput = {
  database: D1Database;
  mediaBucket: R2Bucket;
  artistId: number;
  photoId: number;
};

export async function deleteArtistPhoto(
  input: DeleteArtistPhotoInput,
): Promise<DeleteArtistPhotoResult> {
  const { database, mediaBucket, artistId, photoId } = input;

  const photoToDelete = await findArtistPhotoForDeletion({
    database,
    photoId,
    artistId,
  });

  if (photoToDelete === null) {
    return {
      ok: false,
      failureCode: "photo_not_found",
      detail: "Photo does not exist or does not belong to this artist.",
    };
  }

  try {
    await deleteArtistPhotoRow({ database, photoId: photoToDelete.id });
  } catch (deleteError) {
    console.error("[deleteArtistPhoto] D1 delete failed:", deleteError);
    return {
      ok: false,
      failureCode: "d1_delete_failed",
      detail: "Could not remove the photo. Please try again.",
    };
  }

  try {
    await mediaBucket.delete(photoToDelete.objectKey);
  } catch (r2Error) {
    // The D1 row is already gone; the user sees the photo as deleted. The
    // R2 object is now an unreferenced leak — logged so a future cleanup
    // job can find it, but not surfaced as a user-facing failure because
    // there is nothing the user can do about it.
    console.error(
      `[deleteArtistPhoto] R2 delete failed for ${photoToDelete.objectKey}:`,
      r2Error,
    );
  }

  return { ok: true };
}
