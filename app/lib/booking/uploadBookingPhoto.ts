// app/lib/booking/uploadBookingPhoto.ts

export const BOOKING_PHOTO_UPLOAD_PATH = "/api/booking-photos";

export type UploadedPhoto = {
  objectKey: string;
  width: number;
  height: number;
  byteSize: number;
};

export type UploadPhotoOutcome =
  | { ok: true; photo: UploadedPhoto }
  | { ok: false; failureCode: string; detail: string };

/**
 * Uploads a single reference photo. One request per file so that a failure
 * affects only that file, and so each can be retried or aborted individually.
 */
export async function uploadBookingPhoto({
  file,
  draftId,
  abortSignal,
}: {
  file: File;
  draftId: string;
  abortSignal: AbortSignal;
}): Promise<UploadPhotoOutcome> {
  const requestBody = new FormData();
  requestBody.set("draftId", draftId);
  requestBody.set("photo", file);

  const response = await fetch(BOOKING_PHOTO_UPLOAD_PATH, {
    method: "POST",
    body: requestBody,
    signal: abortSignal,
  });

  return (await response.json()) as UploadPhotoOutcome;
}