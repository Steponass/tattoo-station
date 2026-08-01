export type ArtistRole = "tattoo" | "piercing" | "both";

export type SupportedLocale = "en" | "lt";

export const FALLBACK_LOCALE: SupportedLocale = "en";

/**
 * Turns the `:lang?` URL prefix into a locale to query translations with.
 *
 * The default site locale (Lithuanian) has no URL prefix, so only "en" is ever
 * explicit and anything else — including the absent prefix — resolves to
 * Lithuanian. Lives beside `SupportedLocale` because every caller that needs
 * the resolver already imports the type it returns.
 */
export function resolveLocale(langParam: string | undefined): SupportedLocale {
  return langParam === "en" ? "en" : "lt";
}

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

/**
 * The roster query selects the same columns as the single-profile query — the
 * roster needs styles and avatar dimensions just as the profile page does — so
 * a roster entry is an `ArtistProfile`. Aliased rather than duplicated: two
 * identical types drift the moment a column is added to one query and not the
 * other. If the two reads ever diverge, split these back apart.
 */
export type ArtistRosterRow = ArtistProfileRow;
export type ArtistRosterEntry = ArtistProfile;