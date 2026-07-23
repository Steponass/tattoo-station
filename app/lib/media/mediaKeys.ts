// app/lib/media/mediaKeys.ts

import { NORMALIZED_FILE_EXTENSION } from "~/lib/images/imageConstants";

const BOOKING_PHOTO_PREFIX = "bookings";
const PORTFOLIO_MASTER_PREFIX = "masters";

/**
 * Reference photos for a single booking submission.
 *
 * Scoped by the client-generated draft identifier so the submit action can
 * verify that every submitted key belongs to this submission and was not
 * fabricated or copied from another booking.
 */
export function buildBookingPhotoKey({
  draftId,
  photoId,
}: {
  draftId: string;
  photoId: string;
}): string {
  return `${BOOKING_PHOTO_PREFIX}/${draftId}/${photoId}.${NORMALIZED_FILE_EXTENSION}`;
}

export function buildBookingPhotoPrefix(draftId: string): string {
  return `${BOOKING_PHOTO_PREFIX}/${draftId}/`;
}

export function buildPortfolioMasterKey({
  artistSlug,
  imageId,
}: {
  artistSlug: string;
  imageId: string;
}): string {
  return `${PORTFOLIO_MASTER_PREFIX}/${artistSlug}/${imageId}.${NORMALIZED_FILE_EXTENSION}`;
}