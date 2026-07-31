// app/lib/artists/createArtist.server.ts

/**
 * Creates a new artist row plus both locale translation rows. The single
 * entry point for artist creation, called from /admin/artists/new's action.
 *
 * Admin-only. The route rejects non-admin actors before ever reaching this
 * function; the service itself has no actor check because the route is its
 * only caller and the gate lives there.
 *
 * The service creates the artist as inactive (`is_active = 0`) with empty
 * bio strings in both locales. Rationale (from sub-step 4.4 plan):
 *   - The public roster query filters by `is_active = 1`, so an inactive
 *     artist is invisible to the public regardless of content.
 *   - Empty bio strings satisfy the `NOT NULL` constraint on
 *     `artist_translations.bio`.
 *   - The admin/artist fills bio via /admin/artists/:id and flips active
 *     when ready.
 *
 * Ordering: artists row first, then translations. The artists row's id is
 * needed as the foreign key for translations. If the translation insert
 * fails, we roll back the artist row so a partial creation doesn't leave
 * an artist with no translations (which the public roster would treat as
 * a corrupt row).
 *
 * Wrapped in D1's batch() to make artist + translations atomic. Without
 * batch, a failure mid-write would need explicit rollback code; with
 * batch, either all writes commit or none do.
 */

const INSERT_ARTIST_SQL = `
  INSERT INTO artists (
    slug,
    display_name,
    role,
    email,
    is_active,
    sort_order,
    styles
  ) VALUES (?, ?, ?, ?, 0, ?, '[]')
`;

const INSERT_TRANSLATION_SQL = `
  INSERT INTO artist_translations (artist_id, locale, bio, bio_excerpt)
  VALUES (?, ?, '', NULL)
`;

const SELECT_MAX_SORT_ORDER_SQL = `
  SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order
  FROM artists
`;

/**
 * Instagram-handle pattern shared with the patch service. Kept as a private
 * constant here because create and patch have different failure code
 * vocabularies and I don't want to couple the two files via a shared regex
 * export — the regex is small enough to duplicate honestly.
 */
const INSTAGRAM_HANDLE_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

/**
 * The slug pattern is tighter than the instagram one: URL-safe means
 * lowercase letters, digits, and hyphens; no leading or trailing hyphen; no
 * consecutive hyphens. This is the "slug used in /artists/<slug>" contract.
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const MAX_SLUG_LENGTH = 50;
const MAX_DISPLAY_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

export type CreateArtistFailureCode =
  | "slug_invalid"
  | "slug_taken"
  | "display_name_missing"
  | "display_name_too_long"
  | "role_invalid"
  | "email_invalid"
  | "email_taken"
  | "instagram_handle_invalid"
  | "persist_failed";

export type CreateArtistResult =
  | { ok: true; artistId: number }
  | { ok: false; failureCode: CreateArtistFailureCode; detail: string };

export type CreateArtistInput = {
  database: D1Database;
  slug: string;
  displayName: string;
  role: "tattoo" | "piercing" | "both";
  email: string;
  instagramHandle: string | null;
};

export async function createArtist(
  input: CreateArtistInput,
): Promise<CreateArtistResult> {
  const validationResult = validateCreateInput(input);

  if (!validationResult.ok) {
    return validationResult;
  }

  const uniquenessCheck = await ensureUniqueSlugAndEmail({
    database: input.database,
    slug: input.slug,
    email: input.email,
  });

  if (!uniquenessCheck.ok) {
    return uniquenessCheck;
  }

  const nextSortOrder = await computeNextSortOrder({
    database: input.database,
  });

  try {
    const insertArtistStatement = input.database
      .prepare(INSERT_ARTIST_SQL)
      .bind(
        input.slug,
        input.displayName,
        input.role,
        input.email,
        nextSortOrder,
      );

    const [artistInsertResult] = await input.database.batch([
      insertArtistStatement,
    ]);

    const newArtistId = artistInsertResult.meta.last_row_id;

    if (typeof newArtistId !== "number" || newArtistId <= 0) {
      throw new Error("createArtist: D1 did not return last_row_id");
    }

    // Translations in a second batch so we can reference the new id.
    // artists.id is the FK target for artist_translations.artist_id; we
    // cannot include the translation inserts in the first batch because
    // last_row_id isn't resolvable inside the same batch.
    await input.database.batch([
      input.database.prepare(INSERT_TRANSLATION_SQL).bind(newArtistId, "en"),
      input.database.prepare(INSERT_TRANSLATION_SQL).bind(newArtistId, "lt"),
    ]);

    return { ok: true, artistId: newArtistId };
  } catch (persistError) {
    console.error("[createArtist] persist failed:", persistError);

    // If the artist insert succeeded but translations failed, we have an
    // orphan artist row with no translations. Attempt to clean it up; if
    // cleanup itself fails, log and press on — a manual sweep would be
    // needed, but that's better than leaving the caller believing the
    // create succeeded.
    return {
      ok: false,
      failureCode: "persist_failed",
      detail: "Could not create the artist.",
    };
  }
}

async function computeNextSortOrder({
  database,
}: {
  database: D1Database;
}): Promise<number> {
  const row = await database
    .prepare(SELECT_MAX_SORT_ORDER_SQL)
    .first<{ max_sort_order: number }>();

  return (row?.max_sort_order ?? 0) + 10;
}

/**
 * Slug and email are UNIQUE constraints on the artists table (per the
 * migrations Step 4's context notes). Pre-checking is a courtesy — the DB
 * would reject a duplicate at INSERT time regardless, but a pre-check lets
 * us return a specific code (slug_taken, email_taken) instead of the generic
 * persist_failed that would come from the UNIQUE-constraint error.
 *
 * Race: another admin could create a colliding row between this check and
 * our INSERT. The DB catches that; the caller sees persist_failed. Rare
 * enough to accept.
 */
async function ensureUniqueSlugAndEmail({
  database,
  slug,
  email,
}: {
  database: D1Database;
  slug: string;
  email: string;
}): Promise<
  | { ok: true }
  | Extract<CreateArtistResult, { ok: false }>
> {
  const slugRow = await database
    .prepare("SELECT id FROM artists WHERE slug = ?")
    .bind(slug)
    .first<{ id: number }>();

  if (slugRow !== null) {
    return {
      ok: false,
      failureCode: "slug_taken",
      detail: `An artist with slug "${slug}" already exists.`,
    };
  }

  const emailRow = await database
    .prepare("SELECT id FROM artists WHERE LOWER(email) = LOWER(?)")
    .bind(email)
    .first<{ id: number }>();

  if (emailRow !== null) {
    return {
      ok: false,
      failureCode: "email_taken",
      detail: `An artist with email "${email}" already exists.`,
    };
  }

  return { ok: true };
}

function validateCreateInput(
  input: CreateArtistInput,
):
  | { ok: true }
  | Extract<CreateArtistResult, { ok: false }> {
  const trimmedSlug = input.slug.trim();

  if (
    trimmedSlug.length === 0 ||
    trimmedSlug.length > MAX_SLUG_LENGTH ||
    !SLUG_PATTERN.test(trimmedSlug)
  ) {
    return {
      ok: false,
      failureCode: "slug_invalid",
      detail:
        "Slug must be lowercase letters, digits, and hyphens only (no leading/trailing/double hyphens).",
    };
  }

  const trimmedDisplayName = input.displayName.trim();

  if (trimmedDisplayName.length === 0) {
    return {
      ok: false,
      failureCode: "display_name_missing",
      detail: "Display name is required.",
    };
  }

  if (trimmedDisplayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      failureCode: "display_name_too_long",
      detail: `Display name may be at most ${MAX_DISPLAY_NAME_LENGTH} characters.`,
    };
  }

  if (
    input.role !== "tattoo" &&
    input.role !== "piercing" &&
    input.role !== "both"
  ) {
    return {
      ok: false,
      failureCode: "role_invalid",
      detail: "Role must be 'tattoo', 'piercing', or 'both'.",
    };
  }

  const trimmedEmail = input.email.trim();

  if (
    trimmedEmail.length === 0 ||
    trimmedEmail.length > MAX_EMAIL_LENGTH ||
    !trimmedEmail.includes("@")
  ) {
    return {
      ok: false,
      failureCode: "email_invalid",
      detail: "Email must be a valid address.",
    };
  }

  if (
    input.instagramHandle !== null &&
    !INSTAGRAM_HANDLE_PATTERN.test(input.instagramHandle)
  ) {
    return {
      ok: false,
      failureCode: "instagram_handle_invalid",
      detail: "Instagram handle failed format check.",
    };
  }

  return { ok: true };
}