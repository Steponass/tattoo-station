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

/**
 * An artist's single avatar. Uses a fresh UUID per upload rather than a stable
 * "avatar" name, so the delivery route's immutable, year-long cache stays
 * correct: a re-uploaded avatar is a new key, not changed bytes at an old URL.
 * The previous object is deleted after a successful replace.
 */
export function buildArtistAvatarKey({
  artistSlug,
  imageId,
}: {
  artistSlug: string;
  imageId: string;
}): string {
  return `${PORTFOLIO_MASTER_PREFIX}/${artistSlug}/avatar-${imageId}.${NORMALIZED_FILE_EXTENSION}`;
}