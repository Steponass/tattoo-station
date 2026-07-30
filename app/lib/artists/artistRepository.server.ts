// app/lib/artists/artistRepository.server.ts

import { buildBioExcerpt } from "./buildBioExcerpt";
import {
  FALLBACK_LOCALE,
  type ArtistRosterEntry,
  type ArtistRosterRow,
  type ArtistProfile, 
  type ArtistProfileRow,
  type SupportedLocale,
  type ArtistRole
} from "./artistTypes";

export type BookableArtistRow = {
  id: number;
  display_name: string;
  role: ArtistRole;
};

export type BookableArtist = {
  id: number;
  displayName: string;
  role: ArtistRole;
};

/**
 * Parses the stored styles JSON into a clean string array. Returns an empty
 * array for null or anything malformed, rather than throwing — a bad value in
 * one row should degrade to "no styles", not break the page.
 */
function parseArtistStyles(rawStyles: string | null): string[] {
  if (rawStyles === null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawStyles);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

/**
 * Selects active artists for the booking form's artist dropdown.
 *
 * No translation join: the dropdown shows names and filters by role, neither of
 * which is translated. Deliberately does not select `email` — this result is
 * serialized into the page payload, and publishing nine addresses in page
 * source invites harvesting. The action looks up the email separately once an
 * artist has actually been chosen.
 */
const SELECT_BOOKABLE_ARTISTS_SQL = `
  SELECT
    artists.id,
    artists.display_name,
    artists.role
  FROM artists
  WHERE artists.is_active = 1
  ORDER BY artists.sort_order ASC, artists.display_name ASC
`;

export async function findBookableArtists({
  database,
}: {
  database: D1Database;
}): Promise<BookableArtist[]> {
  const queryResult = await database
    .prepare(SELECT_BOOKABLE_ARTISTS_SQL)
    .all<BookableArtistRow>();

  return queryResult.results.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    role: row.role,
  }));
}

/**
 * Selects every active artist with their translated bio.
 *
 * Two LEFT JOINs against artist_translations: one for the requested
 * locale, one for the fallback locale. COALESCE prefers the requested
 * translation and falls back rather than dropping the artist from the
 * roster — which is what an INNER JOIN would silently do.
 *
 * Deliberately does not select `email`.
 */
const SELECT_ACTIVE_ARTISTS_SQL = `
  SELECT
    artists.id,
    artists.slug,
    artists.display_name,
    artists.role,
    artists.instagram_handle,
    artists.profile_image_key,
    COALESCE(requested.bio, fallback.bio)                 AS bio,
    COALESCE(requested.bio_excerpt, fallback.bio_excerpt) AS bio_excerpt
  FROM artists
  LEFT JOIN artist_translations AS requested
    ON requested.artist_id = artists.id AND requested.locale = ?
  LEFT JOIN artist_translations AS fallback
    ON fallback.artist_id = artists.id AND fallback.locale = ?
  WHERE artists.is_active = 1
  ORDER BY artists.sort_order ASC, artists.display_name ASC
`;

function mapRowToRosterEntry(row: ArtistRosterRow): ArtistRosterEntry | null {
  if (row.bio === null) {
    console.error(
      `[artistRepository] Artist "${row.slug}" (id ${row.id}) has no bio ` +
        `in any locale. Excluded from roster.`,
    );
    return null;
  }

  const excerpt = row.bio_excerpt ?? buildBioExcerpt(row.bio);

  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    role: row.role,
    instagramHandle: row.instagram_handle,
    profileImageKey: row.profile_image_key,
    bio: row.bio,
    bioExcerpt: excerpt,
  };
}

export async function findActiveArtistsForRoster({
  database,
  locale,
}: {
  database: D1Database;
  locale: SupportedLocale;
}): Promise<ArtistRosterEntry[]> {
  const queryResult = await database
    .prepare(SELECT_ACTIVE_ARTISTS_SQL)
    .bind(locale, FALLBACK_LOCALE)
    .all<ArtistRosterRow>();

  return queryResult.results
    .map(mapRowToRosterEntry)
    .filter((entry): entry is ArtistRosterEntry => entry !== null);
}

export type BookingArtistContact = {
  id: number;
  displayName: string;
  role: ArtistRole;
  email: string;
};

const SELECT_ARTIST_CONTACT_SQL = `
  SELECT
    artists.id,
    artists.display_name,
    artists.role,
    artists.email
  FROM artists
  WHERE artists.id = ? AND artists.is_active = 1
`;

/**
 * Resolves a chosen artist's notification address. Server-only: the result is
 * never returned to the browser.
 */
export async function findArtistContactById({
  database,
  artistId,
}: {
  database: D1Database;
  artistId: number;
}): Promise<BookingArtistContact | null> {
  const row = await database
    .prepare(SELECT_ARTIST_CONTACT_SQL)
    .bind(artistId)
    .first<BookableArtistRow & { email: string }>();

  if (row === null) {
    return null;
  }

  return {
    id: row.id,
    displayName: row.display_name,
    role: row.role,
    email: row.email,
  };
}

const SELECT_ARTIST_PROFILE_SQL = `
  SELECT
    artists.id,
    artists.slug,
    artists.display_name,
    artists.role,
    artists.instagram_handle,
    artists.profile_image_key,
    artists.profile_image_width,
    artists.profile_image_height,
    artists.styles,
    COALESCE(requested.bio, fallback.bio)                 AS bio,
    COALESCE(requested.bio_excerpt, fallback.bio_excerpt) AS bio_excerpt
  FROM artists
  LEFT JOIN artist_translations AS requested
    ON requested.artist_id = artists.id AND requested.locale = ?
  LEFT JOIN artist_translations AS fallback
    ON fallback.artist_id = artists.id AND fallback.locale = ?
  WHERE artists.slug = ? AND artists.is_active = 1
`;

/**
 * Resolves a single artist's profile by slug, with bio in the requested locale
 * falling back to the default. Returns null when the artist does not exist, is
 * inactive, or has no bio in any locale.
 */
export async function findArtistProfileBySlug({
  database,
  slug,
  locale,
}: {
  database: D1Database;
  slug: string;
  locale: SupportedLocale;
}): Promise<ArtistProfile | null> {
  const row = await database
    .prepare(SELECT_ARTIST_PROFILE_SQL)
    .bind(locale, FALLBACK_LOCALE, slug)
    .first<ArtistProfileRow>();

  if (row === null || row.bio === null) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    role: row.role,
    instagramHandle: row.instagram_handle,
    profileImageKey: row.profile_image_key,
    profileImageWidth: row.profile_image_width,
    profileImageHeight: row.profile_image_height,
    styles: parseArtistStyles(row.styles),
    bio: row.bio,
    bioExcerpt: row.bio_excerpt ?? buildBioExcerpt(row.bio),
  };
}

export type ArtistAvatarTarget = {
  id: number;
  slug: string;
  currentAvatarKey: string | null;
};

const SELECT_ARTIST_AVATAR_TARGET_SQL = `
  SELECT id, slug, profile_image_key
  FROM artists
  WHERE id = ?
`;

/**
 * Resolves the slug (for the new object key) and the current avatar key (to
 * delete after a successful replace) for an artist, or null if none exists.
 */
export async function findArtistForAvatarUpdate({
  database,
  artistId,
}: {
  database: D1Database;
  artistId: number;
}): Promise<ArtistAvatarTarget | null> {
  const row = await database
    .prepare(SELECT_ARTIST_AVATAR_TARGET_SQL)
    .bind(artistId)
    .first<{ id: number; slug: string; profile_image_key: string | null }>();

  if (row === null) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    currentAvatarKey: row.profile_image_key,
  };
}

const UPDATE_ARTIST_AVATAR_SQL = `
  UPDATE artists
  SET
    profile_image_key    = ?,
    profile_image_width  = ?,
    profile_image_height = ?
  WHERE id = ?
`;

export async function updateArtistAvatar({
  database,
  artistId,
  objectKey,
  width,
  height,
}: {
  database: D1Database;
  artistId: number;
  objectKey: string;
  width: number;
  height: number;
}): Promise<void> {
  await database
    .prepare(UPDATE_ARTIST_AVATAR_SQL)
    .bind(objectKey, width, height, artistId)
    .run();
}

const SELECT_ARTIST_ID_BY_EMAIL_SQL = `
  SELECT id
  FROM artists
  WHERE LOWER(email) = LOWER(?)
`;

/**
 * Resolves an artist's id from their email address, case-insensitively. Used by
 * the actor resolver: when the Access JWT's email isn't in the admin allowlist,
 * we fall through to this lookup to see if it belongs to a known artist.
 *
 * Deliberately not filtered by `is_active`. An artist who has toggled themselves
 * inactive should still be able to log in and manage their own profile — for
 * example, to reactivate or correct something before returning. The `is_active`
 * flag governs public visibility on the roster, not access to the admin. This
 * matches §3 of the build handoff: "look up artists by email (active or not)".
 *
 * The `LOWER(...) = LOWER(?)` comparison sidesteps any case mismatch between the
 * hand-entered D1 row and the hand-entered Cloudflare Access policy entry — a
 * class of "why can't Ada log in when her email is right there" bug at basically
 * zero cost given the ~10-row table. ASCII-only, which matches every real-world
 * email address at this studio.
 *
 * Returns only `id`. The resolver builds the full actor union from the id plus
 * the JWT-supplied email; it never needs anything else from this row.
 */
export async function findArtistIdByEmail({
  database,
  email,
}: {
  database: D1Database;
  email: string;
}): Promise<number | null> {
  const row = await database
    .prepare(SELECT_ARTIST_ID_BY_EMAIL_SQL)
    .bind(email)
    .first<{ id: number }>();

  if (row === null) {
    return null;
  }

  return row.id;
}

/**
 * The full editable state of an artist, as needed by the /admin/me and
 * /admin/artists/:id form loaders.
 *
 * Distinct from `ArtistProfile` (the public read): translations are returned
 * per-locale rather than COALESCE'd, is_active is included, and the row is
 * not filtered by is_active.
 *
 * `translations` is keyed by locale; a locale may be absent (the row does not
 * exist yet) or present with a null bio (row exists but was blanked). The
 * editor treats both as "empty" — the distinction only matters at write time,
 * where the patch endpoint decides insert vs. update.
 */
export type ArtistProfileForEditing = {
  id: number;
  slug: string;
  displayName: string;
  role: ArtistRole;
  email: string;
  instagramHandle: string | null;
  isActive: boolean;
  styles: string[];
  profileImageKey: string | null;
  profileImageWidth: number | null;
  profileImageHeight: number | null;
  translations: Record<SupportedLocale, ArtistTranslationForEditing | null>;
};

export type ArtistTranslationForEditing = {
  bio: string | null;
  bioExcerpt: string | null;
};

type ArtistProfileEditRow = {
  id: number;
  slug: string;
  display_name: string;
  role: ArtistRole;
  email: string;
  instagram_handle: string | null;
  is_active: number;
  styles: string | null;
  profile_image_key: string | null;
  profile_image_width: number | null;
  profile_image_height: number | null;
};

type ArtistTranslationEditRow = {
  locale: SupportedLocale;
  bio: string | null;
  bio_excerpt: string | null;
};

const SELECT_ARTIST_FOR_EDITING_SQL = `
  SELECT
    id,
    slug,
    display_name,
    role,
    email,
    instagram_handle,
    is_active,
    styles,
    profile_image_key,
    profile_image_width,
    profile_image_height
  FROM artists
  WHERE id = ?
`;

const SELECT_ARTIST_TRANSLATIONS_FOR_EDITING_SQL = `
  SELECT locale, bio, bio_excerpt
  FROM artist_translations
  WHERE artist_id = ?
`;

/**
 * Loads an artist's full editable state — the profile row and every locale of
 * their translations, returned side-by-side rather than merged.
 *
 * Returns null only when the artist row does not exist. Missing translations
 * for a locale surface as `translations[locale] === null`, not as an error:
 * the editor renders empty fields and the patch endpoint decides insert vs.
 * update at save time.
 *
 * Two queries rather than a JOIN. A JOIN with two locale rows fans the artist
 * columns across two result rows; either the caller de-duplicates them or the
 * SQL aggregates per-locale into named columns (bio_en, bio_lt, ...). Both
 * options are more code than "one row for the artist, one query for the
 * translations, zip them client-side." At two locales and a per-request cost
 * of ~1ms on D1, this is not the query to optimize.
 */
export async function findArtistProfileForEditing({
  database,
  artistId,
}: {
  database: D1Database;
  artistId: number;
}): Promise<ArtistProfileForEditing | null> {
  const artistRow = await database
    .prepare(SELECT_ARTIST_FOR_EDITING_SQL)
    .bind(artistId)
    .first<ArtistProfileEditRow>();

  if (artistRow === null) {
    return null;
  }

  const translationsResult = await database
    .prepare(SELECT_ARTIST_TRANSLATIONS_FOR_EDITING_SQL)
    .bind(artistId)
    .all<ArtistTranslationEditRow>();

  const translationsByLocale = buildTranslationsByLocale(
    translationsResult.results,
  );

  return {
    id: artistRow.id,
    slug: artistRow.slug,
    displayName: artistRow.display_name,
    role: artistRow.role,
    email: artistRow.email,
    instagramHandle: artistRow.instagram_handle,
    isActive: artistRow.is_active === 1,
    styles: parseArtistStyles(artistRow.styles),
    profileImageKey: artistRow.profile_image_key,
    profileImageWidth: artistRow.profile_image_width,
    profileImageHeight: artistRow.profile_image_height,
    translations: translationsByLocale,
  };
}

/**
 * Reshapes the flat list of translation rows into a locale-keyed record. The
 * record has an entry for every supported locale — locales without a row are
 * explicitly null, so the editor never confuses "not loaded" with "empty."
 */
function buildTranslationsByLocale(
  rows: ArtistTranslationEditRow[],
): Record<SupportedLocale, ArtistTranslationForEditing | null> {
  const translationsByLocale: Record<SupportedLocale, ArtistTranslationForEditing | null> = {
    en: null,
    lt: null,
  };

  for (const row of rows) {
    translationsByLocale[row.locale] = {
      bio: row.bio,
      bioExcerpt: row.bio_excerpt,
    };
  }

  return translationsByLocale;
}