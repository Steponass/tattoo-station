// app/lib/artists/artistPhotoCategories.ts

export const ARTIST_PHOTO_CATEGORIES = ["tattoo", "piercing", "flash"] as const;

export type ArtistPhotoCategory = (typeof ARTIST_PHOTO_CATEGORIES)[number];

export function isArtistPhotoCategory(
  candidateValue: string,
): candidateValue is ArtistPhotoCategory {
  return (ARTIST_PHOTO_CATEGORIES as readonly string[]).includes(candidateValue);
}