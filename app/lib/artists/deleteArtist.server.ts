// app/lib/artists/deleteArtist.server.ts

import {
  findArtistForAvatarUpdate,
  findArtistProfileForEditing,
} from "./artistRepository.server";
import { findArtistPhotos } from "./artistPhotoRepository.server";

/**
 * Deletes one artist row plus every associated resource. The single entry
 * point for artist deletion, called from /admin/artists/:id/delete's action.
 *
 * Admin-only. The route rejects non-admin actors before ever reaching this
 * function; the service itself has no actor check because the route is its
 * only caller.
 *
 * The delete order matters:
 *
 *   1. Read D1 for every R2 object key belonging to the artist (photos +
 *      avatar). We enumerate what to sweep BEFORE touching D1, so the cascade
 *      doesn't remove the rows that told us which R2 objects to delete.
 *   2. Sweep R2 (best-effort). Each failure is logged; the sweep continues.
 *      Rationale is the same as deleteArtistPhoto: an R2 leak is invisible,
 *      a D1 row pointing at missing bytes is user-visible.
 *   3. Delete the D1 artist row. ON DELETE CASCADE handles artist_translations,
 *      artist_photos, and gallery_placements automatically.
 *
 * If step 2 partially fails (some R2 objects deleted, some not), step 3 still
 * runs. The artist is gone from D1, some object masters remain orphaned in
 * R2. A future maintenance script can sweep by diffing R2 keys against D1
 * object_keys.
 */

export type DeleteArtistFailureCode =
  | "artist_not_found"
  | "d1_delete_failed";

export type DeleteArtistResult =
  | { ok: true; displayName: string; r2ObjectsSwept: number; r2ObjectsFailed: number }
  | { ok: false; failureCode: DeleteArtistFailureCode; detail: string };

export type DeleteArtistInput = {
  database: D1Database;
  mediaBucket: R2Bucket;
  artistId: number;
};

export async function deleteArtist(
  input: DeleteArtistInput,
): Promise<DeleteArtistResult> {
  const { database, mediaBucket, artistId } = input;

  // Look up the display name for the response so the UI can show
  // "Deleted <name>" without having to remember it client-side.
  const artistProfile = await findArtistProfileForEditing({
    database,
    artistId,
  });

  if (artistProfile === null) {
    return {
      ok: false,
      failureCode: "artist_not_found",
      detail: "Artist does not exist.",
    };
  }

  // Enumerate every R2 object key the artist owns: portfolio masters + the
  // current avatar object. Both live under masters/{slug}/. We read from D1
  // rather than R2.list() so slug reuse (delete-then-create with the same
  // slug later) can't accidentally sweep the new artist's objects.
  const photoRecords = await findArtistPhotos({ database, artistId });

  const avatarTarget = await findArtistForAvatarUpdate({
    database,
    artistId,
  });

  const objectKeysToDelete: string[] = photoRecords.map((photo) => photo.objectKey);

  if (avatarTarget !== null && avatarTarget.currentAvatarKey !== null) {
    objectKeysToDelete.push(avatarTarget.currentAvatarKey);
  }

  let r2ObjectsSwept = 0;
  let r2ObjectsFailed = 0;

  for (const objectKey of objectKeysToDelete) {
    try {
      await mediaBucket.delete(objectKey);
      r2ObjectsSwept += 1;
    } catch (r2Error) {
      // Best-effort sweep. A failed R2 delete leaves an orphan object but
      // doesn't block deletion — the D1 row still goes, the artist still
      // disappears from the site, and the orphan is a background concern
      // for a future cleanup pass.
      console.error(
        `[deleteArtist] R2 delete failed for ${objectKey}:`,
        r2Error,
      );
      r2ObjectsFailed += 1;
    }
  }

  try {
    await database
      .prepare("DELETE FROM artists WHERE id = ?")
      .bind(artistId)
      .run();
  } catch (d1Error) {
    // The D1 delete failed AFTER we've already deleted R2 objects. Every
    // deleted photo's D1 row still points at nothing in R2 — broken images
    // on the site if the artist row survives.
    //
    // This is a wedged state, but not one we can recover from here. Log
    // loudly; the admin will retry, and the retry will either succeed (D1
    // finally accepts) or hit the same error (needs manual intervention).
    // On the retry, the R2 sweep runs against the same D1 rows and gets
    // 404s for the already-deleted objects (R2 returns 204 for delete of
    // missing key — success). So retry is safe.
    console.error("[deleteArtist] D1 delete failed:", d1Error);
    return {
      ok: false,
      failureCode: "d1_delete_failed",
      detail: "Could not remove the artist row.",
    };
  }

  return {
    ok: true,
    displayName: artistProfile.displayName,
    r2ObjectsSwept,
    r2ObjectsFailed,
  };
}