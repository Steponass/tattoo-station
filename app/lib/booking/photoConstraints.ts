/**
 * Limits on booking reference photo uploads.
 *
 * Shared between client and server: the browser uses these for immediate
 * feedback, and the upload endpoint re-applies them because client-side checks
 * are a convenience, not a control.
 */

export const MAX_PHOTOS_PER_BOOKING = 5;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * iPhone photos arrive as HEIC and are normalized to JPEG server-side, so HEIC
 * is accepted here despite never being stored.
 */
export const ACCEPTED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/**
 * Extension fallback for browsers that report an empty MIME type. iOS Safari
 * does this for HEIC often enough that MIME alone rejects legitimate uploads.
 */
export const ACCEPTED_PHOTO_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
] as const;

/** Value for the file input's accept attribute. */
export const PHOTO_INPUT_ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_PHOTO_MIME_TYPES,
  ...ACCEPTED_PHOTO_EXTENSIONS.map((extension) => `.${extension}`),
].join(",");

export type PhotoRejectionCode =
  | "too_many_photos"
  | "file_too_large"
  | "unsupported_file_type";

export type PhotoValidation =
  | { accepted: true }
  | { accepted: false; rejectionCode: PhotoRejectionCode };

function extractFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

function hasAcceptedFileType({
  mimeType,
  fileName,
}: {
  mimeType: string;
  fileName: string;
}): boolean {
  const isAcceptedMimeType = (
    ACCEPTED_PHOTO_MIME_TYPES as readonly string[]
  ).includes(mimeType.toLowerCase());

  if (isAcceptedMimeType) {
    return true;
  }

  return (ACCEPTED_PHOTO_EXTENSIONS as readonly string[]).includes(
    extractFileExtension(fileName),
  );
}

export function validatePhotoSelection({
  fileName,
  mimeType,
  fileSizeBytes,
  alreadySelectedCount,
}: {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  alreadySelectedCount: number;
}): PhotoValidation {
  if (alreadySelectedCount >= MAX_PHOTOS_PER_BOOKING) {
    return { accepted: false, rejectionCode: "too_many_photos" };
  }

  if (fileSizeBytes > MAX_PHOTO_BYTES) {
    return { accepted: false, rejectionCode: "file_too_large" };
  }

  if (!hasAcceptedFileType({ mimeType, fileName })) {
    return { accepted: false, rejectionCode: "unsupported_file_type" };
  }

  return { accepted: true };
}