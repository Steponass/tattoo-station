export type ArtistRole = "tattoo" | "piercing" | "both";

export type SupportedLocale = "en" | "lt";

export const FALLBACK_LOCALE: SupportedLocale = "en";

/**
 * Shape returned by D1. Column names are snake_case and every
 * translated field is nullable because the joins are LEFT joins.
 */
export type ArtistProfileRow = {
  id: number;
  slug: string;
  display_name: string;
  role: ArtistRole;
  instagram_handle: string | null;
  profile_image_key: string | null;
  profile_image_width: number | null;
  profile_image_height: number | null;
  styles: string | null;
  bio: string | null;
  bio_excerpt: string | null;
};

/**
 * Shape the UI consumes. camelCase, no nulls on required fields,
 * excerpt always present.
 */
export type ArtistProfile = {
  id: number;
  slug: string;
  displayName: string;
  role: ArtistRole;
  instagramHandle: string | null;
  profileImageKey: string | null;
  profileImageWidth: number | null;
  profileImageHeight: number | null;
  bio: string;
  bioExcerpt: string;
  styles: string[];
};