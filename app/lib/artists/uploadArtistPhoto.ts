// app/lib/artists/uploadArtistPhoto.ts

export const ARTIST_PHOTO_UPLOAD_PATH = "/api/artist-photos";

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

/**
 * Uploads a single portfolio photo. One request per file, so a failure or
 * retry is isolated to that file.
 *
 * The client passes `surface` (a UI concept — "which page am I on?"); the
 * server derives `category` (a data concept) from that plus the artist's
 * role. Artists never see the word "category" in this flow.
 */
export async function uploadArtistPhoto({
  file,
  surface = "main",
}: {
  file: File;
  surface?: UploadSurface;
}): Promise<ArtistPhotoUploadOutcome> {
  const requestBody = new FormData();
  requestBody.set("photo", file);
  requestBody.set("surface", surface);

  const response = await fetch(ARTIST_PHOTO_UPLOAD_PATH, {
    method: "POST",
    body: requestBody,
  });

  return (await response.json()) as ArtistPhotoUploadOutcome;
}