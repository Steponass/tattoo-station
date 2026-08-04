// app/lib/artists/uploadArtistPhoto.ts

import type { ArtistPhotoCategory } from "./artistPhotoCategories";

export const ARTIST_PHOTO_UPLOAD_PATH = "/admin/api/artist-photos";

/**
 * The client's view of a successfully uploaded portfolio photo. Includes the
 * D1 primary key `id` so the grid can reference the tile in later mutations
 * (reorder, delete). Matches the shape returned by the server-side
 * `storeArtistPhoto` service, minus fields the client doesn't consume.
 */
export type UploadedArtistPhoto = {
  id: number;
  objectKey: string;
  width: number;
  height: number;
  style: string | null;
};

export type ArtistPhotoUploadOutcome =
  | { ok: true; photo: UploadedArtistPhoto }
  | { ok: false; failureCode: string; detail: string };

/**
 * The upload surface an artist is uploading from. The server derives the
 * actual `category` from surface + role. "main" resolves to the artist's
 * main category ('tattoo' or 'piercing'); "flash" resolves to 'flash' for
 * tattoo/both roles and is rejected for piercer.
 */
export type UploadSurface = "main" | "flash";

type UploadArtistPhotoInput =
  | {
      file: File;
      surface?: UploadSurface;
      targetArtistIdForAdmin?: undefined;
    }
  | {
      file: File;
      targetArtistIdForAdmin: number;
      category: ArtistPhotoCategory;
    };

/**
 * Uploads a single portfolio photo. One request per file, so a failure or
 * retry is isolated to that file.
 *
 * The client passes `surface` (a UI concept — "which page am I on?"); the
 * server derives `category` (a data concept) from that plus the artist's
 * role. Artists never see the word "category" in this flow.
 *
 * Admin callers (editing another artist's photos from /admin/artists/:id/*)
 * pass `targetArtistIdForAdmin` and an explicit `category` instead — the
 * server's admin branch reads `artistId`/`category` directly rather than
 * deriving them from `surface` + the caller's own role. Mirrors how
 * AvatarField adds `artistId` to its upload FormData only for admin callers.
 */
export async function uploadArtistPhoto(
  input: UploadArtistPhotoInput,
): Promise<ArtistPhotoUploadOutcome> {
  const { file } = input;

  const requestBody = new FormData();
  requestBody.set("photo", file);

  if (input.targetArtistIdForAdmin !== undefined) {
    requestBody.set("artistId", String(input.targetArtistIdForAdmin));
    requestBody.set("category", input.category);
  } else {
    requestBody.set("surface", input.surface ?? "main");
  }

  let response: Response;

  try {
    response = await fetch(ARTIST_PHOTO_UPLOAD_PATH, {
      method: "POST",
      body: requestBody,
    });
  } catch {
    return {
      ok: false,
      failureCode: "network_error",
      detail: "The upload request failed to reach the server.",
    };
  }

  // A 5xx from the platform itself (rather than this route's handler) can
  // arrive as an HTML error page instead of JSON — e.g. a Worker CPU/subrequest
  // limit or an unhandled exception upstream of our JSON-only response
  // contract. `.json()` would throw a SyntaxError on that body; without this
  // guard, that throw propagates out of the caller's upload loop and aborts
  // the rest of the batch instead of being recorded as one file's failure.
  try {
    return (await response.json()) as ArtistPhotoUploadOutcome;
  } catch {
    return {
      ok: false,
      failureCode: "server_error",
      detail: `The server returned an unexpected response (status ${response.status}).`,
    };
  }
}