// app/lib/artists/uploadArtistAvatar.ts

export const ARTIST_AVATAR_UPLOAD_PATH = "/admin/api/artist-avatar";

export type UploadedArtistAvatar = {
  objectKey: string;
  width: number;
  height: number;
  byteSize: number;
};

export type ArtistAvatarUploadOutcome =
  | { ok: true; avatar: UploadedArtistAvatar }
  | { ok: false; failureCode: string; detail: string };

export async function uploadArtistAvatar({
  file,
  artistId,
  abortSignal,
}: {
  file: File;
  artistId: number;
  abortSignal: AbortSignal;
}): Promise<ArtistAvatarUploadOutcome> {
  const requestBody = new FormData();
  requestBody.set("artistId", String(artistId));
  requestBody.set("photo", file);

  const response = await fetch(ARTIST_AVATAR_UPLOAD_PATH, {
    method: "POST",
    body: requestBody,
    signal: abortSignal,
  });

  return (await response.json()) as ArtistAvatarUploadOutcome;
}