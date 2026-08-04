// app/lib/booking/resolveArtistPreselection.ts

import type { BookableArtist } from "~/lib/artists/artistRepository.server";
import {
  defaultServiceCategoryForArtistRole,
  type ServiceCategory,
} from "./bookingConstants";

export type ArtistPreselection = {
  serviceCategory: ServiceCategory;
  artistSelection: string;
} | null;

/**
 * Resolves a `?artist=<slug>` query param against the bookable roster.
 *
 * Returns null when there's no param, or the slug doesn't match an active
 * bookable artist — the form falls back to its normal blank state rather
 * than preselecting a broken option (e.g. a stale link to a deactivated
 * artist).
 */
export function resolveArtistPreselection({
  artists,
  requestedArtistSlug,
}: {
  artists: readonly BookableArtist[];
  requestedArtistSlug: string | null;
}): ArtistPreselection {
  if (requestedArtistSlug === null) {
    return null;
  }

  const artist = artists.find(
    (candidate) => candidate.slug === requestedArtistSlug,
  );

  if (artist === undefined) {
    return null;
  }

  return {
    serviceCategory: defaultServiceCategoryForArtistRole(artist.role),
    artistSelection: String(artist.id),
  };
}
