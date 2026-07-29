// app/lib/artists/uploadArtistPhoto.ts

import type { ArtistStyle } from "./artistStyles";
import type { ArtistPhotoCategory } from "./artistPhotoCategories";

export const ARTIST_PHOTO_UPLOAD_PATH = "/api/artist-photos";

export type UploadedArtistPhoto = {
  objectKey: string;
  width: number;
  height: number;
  byteSize: number;
  sortOrder: number;
};

export type ArtistPhotoUploadOutcome =
  | { ok: true; photo: UploadedArtistPhoto }
  | { ok: false; failureCode: string; detail: string };

/**
 * Uploads a single portfolio photo for an artist. One request per file, so a
 * failure or retry is isolated to that file.
 */
export async function uploadArtistPhoto({
  file,
  artistId,
  category,
  style,
  abortSignal,
}: {
  file: File;
  artistId: number;
  category: ArtistPhotoCategory;
  style: ArtistStyle | null;
  abortSignal: AbortSignal;
}): Promise<ArtistPhotoUploadOutcome> {
  const requestBody = new FormData();
  requestBody.set("artistId", String(artistId));
  requestBody.set("photo", file);
  requestBody.set("category", category);

  if (style !== null) {
    requestBody.set("style", style);
  }

  const response = await fetch(ARTIST_PHOTO_UPLOAD_PATH, {
    method: "POST",
    body: requestBody,
    signal: abortSignal,
  });

  return (await response.json()) as ArtistPhotoUploadOutcome;
}