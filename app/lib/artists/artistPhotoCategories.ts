// app/lib/artists/artistPhotoCategories.ts

import type { ArtistRole } from "./artistTypes";

export const ARTIST_PHOTO_CATEGORIES = ["tattoo", "piercing", "flash"] as const;

export type ArtistPhotoCategory = (typeof ARTIST_PHOTO_CATEGORIES)[number];

export function isArtistPhotoCategory(
  candidateValue: string,
): candidateValue is ArtistPhotoCategory {
  return (ARTIST_PHOTO_CATEGORIES as readonly string[]).includes(candidateValue);
}

/**
 * Maps an artist's role to the category their "main photos" grid displays and
 * writes to. Encapsulated here rather than inline at route loaders because two
 * routes (/admin/me/photos and /admin/artists/:id in step 4) will use it, and
 * because keeping the role-to-category mapping in one place makes an eventual
 * "artist becomes tattoo+piercing" flow one function to update.
 *
 * The flash category is never a "main" category — flash lives on its own tab.
 * `role="both"` maps to tattoo because both-role artists list their tattoo
 * work on their main gallery; their piercing work is displayed under the
 * profile's role tag but not as a separate main gallery.
 */
export function mainPhotoCategoryForRole(
  role: ArtistRole,
): ArtistPhotoCategory {
  if (role === "piercing") {
    return "piercing";
  }
  return "tattoo";
}