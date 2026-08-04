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

  const response = await fetch(ARTIST_PHOTO_UPLOAD_PATH, {
    method: "POST",
    body: requestBody,
  });

  return (await response.json()) as ArtistPhotoUploadOutcome;
}