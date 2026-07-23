export type ArtistRole = "tattoo" | "piercing" | "both";

export type SupportedLocale = "en" | "lt";

export const FALLBACK_LOCALE: SupportedLocale = "en";

/**
 * Shape returned by D1. Column names are snake_case and every
 * translated field is nullable because the joins are LEFT joins.
 */
export type ArtistRosterRow = {
  id: number;
  slug: string;
  display_name: string;
  role: ArtistRole;
  instagram_handle: string | null;
  profile_image_key: string | null;
  bio: string | null;
  bio_excerpt: string | null;
};

/**
 * Shape the UI consumes. camelCase, no nulls on required fields,
 * excerpt always present.
 */
export type ArtistRosterEntry = {
  id: number;
  slug: string;
  displayName: string;
  role: ArtistRole;
  instagramHandle: string | null;
  profileImageKey: string | null;
  bio: string;
  bioExcerpt: string;
};