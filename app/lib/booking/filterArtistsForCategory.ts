// app/lib/booking/filterArtistsForCategory.ts

import {
  ARTIST_ROLES_BY_CATEGORY,
  type ServiceCategory,
} from "./bookingConstants";

export type BookableArtist = {
  id: number;
  displayName: string;
  role: string;
};

/**
 * Narrows the roster to artists who perform the selected service.
 *
 * Runs client-side against the full roster shipped by the loader, so switching
 * category re-filters instantly without a second request.
 */
export function filterArtistsForCategory({
  artists,
  serviceCategory,
}: {
  artists: readonly BookableArtist[];
  serviceCategory: ServiceCategory | null;
}): BookableArtist[] {
  if (serviceCategory === null) {
    return [];
  }

  const eligibleRoles: readonly string[] =
    ARTIST_ROLES_BY_CATEGORY[serviceCategory];

  return artists.filter((artist) => eligibleRoles.includes(artist.role));
}