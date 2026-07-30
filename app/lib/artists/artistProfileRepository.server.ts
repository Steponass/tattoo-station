// app/lib/artists/artistProfileRepository.server.ts

import type { SupportedLocale } from "./artistTypes";

/**
 * Writes for the artists row. Separated from `artistRepository.server.ts`,
 * which holds the reads, because the write surface will keep growing (patch,
 * create, delete, roster reorder) and a single mixed file starts to hide
 * intent. Reads stay pure lookups; writes become the mutation vocabulary.
 *
 * Every function here takes an explicit `artistId`. The route/service layer
 * has already resolved the actor and decided which id may be written; the
 * repository has no opinion on authorization and never derives an id from
 * anywhere but its arguments.
 */

/**
 * The columns this endpoint may write, in the shape they come from the
 * service (JS-native types). The service is responsible for constraining
 * which columns an artist actor vs. an admin actor may touch; this type is
 * the union of everything either can send.
 *
 * `undefined` means "don't write this column." `null` (where allowed) means
 * "write NULL." The distinction matters because a partial patch should not
 * overwrite untouched columns.
 */
export type ArtistProfileWritableFields = {
  slug?: string;
  displayName?: string;
  role?: "tattoo" | "piercing" | "both";
  email?: string;
  instagramHandle?: string | null;
  isActive?: boolean;
  styles?: string[];
};

/**
 * Writes only the fields present in `fields`. Absent keys leave columns
 * untouched. Returns whether a row was actually matched — the caller uses
 * this to distinguish "wrote nothing because the id doesn't exist" from
 * "wrote nothing because the patch was empty" (the latter never reaches
 * here; the service short-circuits on empty patches).
 *
 * The SQL is built dynamically because D1 has no equivalent of Postgres's
 * `SET col = COALESCE(?, col)` that would let us send NULLs meaning "no
 * change." With static SQL we'd have to either write every column every
 * time (breaks partial-patch semantics: two concurrent partial edits would
 * clobber each other) or use one UPDATE per field (N round-trips). Dynamic
 * SQL with parameterized values is safe here — column names come from a
 * closed vocabulary in this module, not from user input.
 */
export async function updateArtistProfileFields({
  database,
  artistId,
  fields,
}: {
  database: D1Database;
  artistId: number;
  fields: ArtistProfileWritableFields;
}): Promise<{ rowMatched: boolean }> {
  const assignments: string[] = [];
  const bindValues: (string | number | null)[] = [];

  if (fields.slug !== undefined) {
    assignments.push("slug = ?");
    bindValues.push(fields.slug);
  }

  if (fields.displayName !== undefined) {
    assignments.push("display_name = ?");
    bindValues.push(fields.displayName);
  }

  if (fields.role !== undefined) {
    assignments.push("role = ?");
    bindValues.push(fields.role);
  }

  if (fields.email !== undefined) {
    assignments.push("email = ?");
    bindValues.push(fields.email);
  }

  if (fields.instagramHandle !== undefined) {
    assignments.push("instagram_handle = ?");
    bindValues.push(fields.instagramHandle);
  }

  if (fields.isActive !== undefined) {
    assignments.push("is_active = ?");
    bindValues.push(fields.isActive ? 1 : 0);
  }

  if (fields.styles !== undefined) {
    assignments.push("styles = ?");
    bindValues.push(JSON.stringify(fields.styles));
  }

  if (assignments.length === 0) {
    // Defensive. The service should never call this with an empty patch,
    // but if it does, a `SET` with no assignments is a SQL error — bail
    // rather than emit malformed SQL.
    return { rowMatched: true };
  }

  const updateSql = `UPDATE artists SET ${assignments.join(", ")} WHERE id = ?`;

  bindValues.push(artistId);

  const result = await database
    .prepare(updateSql)
    .bind(...bindValues)
    .run();

  return { rowMatched: (result.meta.changes ?? 0) > 0 };
}

/**
 * Upserts one locale's translation row. INSERT ... ON CONFLICT DO UPDATE
 * matches the semantics we want: a first-time save creates the row, later
 * saves update it, and the caller doesn't need a prior "does it exist"
 * check.
 *
 * `bio` and `bioExcerpt` are both nullable — the editor can blank a locale
 * that was previously filled. That's distinct from "don't touch this
 * locale," which the service handles by not calling this function at all.
 */
const ENSURE_ARTIST_TRANSLATION_EXISTS_SQL = `
  INSERT INTO artist_translations (artist_id, locale, bio)
  VALUES (?, ?, '')
  ON CONFLICT (artist_id, locale) DO NOTHING
`;

/**
 * Upserts one locale's translation row, touching only the columns whose values
 * were provided. `undefined` means "don't touch this column"; `null` means
 * "write NULL"; a string means "write this string."
 *
 * Implemented as two statements — INSERT-OR-NOTHING to guarantee the row
 * exists, then UPDATE with dynamically-selected columns — rather than a single
 * `INSERT ... ON CONFLICT DO UPDATE SET`, because the single-statement form
 * writes every listed column and cannot distinguish "no value provided" from
 * "NULL." That distinction is the whole point of partial patch semantics:
 * saving a new bio must not blank the sibling excerpt.
 *
 * The dynamic SQL is safe. Column names come from a closed literal set below,
 * never from caller input; only values are parameterized.
 */
export async function upsertArtistTranslation({
  database,
  artistId,
  locale,
  bio,
  bioExcerpt,
}: {
  database: D1Database;
  artistId: number;
  locale: SupportedLocale;
  bio?: string | null;
  bioExcerpt?: string | null;
}): Promise<void> {
  if (bio === undefined && bioExcerpt === undefined) {
    // Nothing to write. Caller shouldn't have invoked us, but defending
    // against an empty call is cheaper than requiring every caller to check.
    return;
  }

  await database
    .prepare(ENSURE_ARTIST_TRANSLATION_EXISTS_SQL)
    .bind(artistId, locale)
    .run();

  const assignments: string[] = [];
  const bindValues: (string | null)[] = [];

  if (bio !== undefined) {
    assignments.push("bio = ?");
    bindValues.push(bio);
  }

  if (bioExcerpt !== undefined) {
    assignments.push("bio_excerpt = ?");
    bindValues.push(bioExcerpt);
  }

  const updateSql = `
    UPDATE artist_translations
    SET ${assignments.join(", ")}
    WHERE artist_id = ? AND locale = ?
  `;

  await database
    .prepare(updateSql)
    .bind(...bindValues, artistId, locale)
    .run();
}