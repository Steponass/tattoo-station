// app/lib/artists/artistProfilePatch.server.ts

import { isArtistStyle } from "./artistStyles";
import type { SupportedLocale } from "./artistTypes";
import type { Actor } from "~/lib/admin/server/resolveActor.server";
import {
  updateArtistProfileFields,
  upsertArtistTranslation,
  type ArtistProfileWritableFields,
} from "./artistProfileRepository.server";

/**
 * Applies a validated patch to an artist's profile. The single entry point for
 * both the artist-self-service editor and the admin editor.
 *
 * The service — not the route — decides which fields each actor kind is
 * allowed to write. That is the actor-pinning-as-a-service-concern rule from
 * §8 of the build handoff: the route can hand the service any patch it likes,
 * but the service's type shape and validation together mean an artist actor
 * cannot mutate slug/role/email/display_name, and admin-only field values
 * submitted through the artist branch are silently absent from the type.
 */

/**
 * Max lengths are UTF-16 code-unit counts (`String.prototype.length`). The
 * budget is editorial, not a storage cap — D1 TEXT has no configured limit —
 * so the exact number matters less than "we enforce something." 3000 is
 * roughly 500 words, enough for a long-form artist statement; 300 leaves
 * room for a two-sentence lead. Push back if either is wrong for what the
 * studio actually writes.
 */
export const MAX_BIO_LENGTH = 3000;
export const MAX_BIO_EXCERPT_LENGTH = 300;

export const MAX_STYLES = 5;

/**
 * Instagram's real handle rules are looser (dots, no consecutive dots, no
 * trailing dot, 30 char max, letters/digits/underscores). This regex is a
 * strict subset that catches typos without needing a state machine. Stored
 * bare — no leading `@` — because the display layer adds the `@`.
 */
const INSTAGRAM_HANDLE_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

/**
 * The fields an artist actor may patch on themselves. Every key optional —
 * a patch is a partial update.
 */
export type ArtistSelfPatchableFields = {
  bioByLocale?: Partial<Record<SupportedLocale, string | null>>;
  bioExcerptByLocale?: Partial<Record<SupportedLocale, string | null>>;
  styles?: string[];
  isActive?: boolean;
  instagramHandle?: string | null;
};

/**
 * The admin superset. Structurally an artist patch plus the four
 * admin-only fields.
 */
export type AdminPatchableFields = ArtistSelfPatchableFields & {
  slug?: string;
  displayName?: string;
  role?: "tattoo" | "piercing" | "both";
  email?: string;
};

/**
 * Discriminated patch. Kind determines which validation and write path
 * the service runs; artist-kind patches literally cannot carry admin-only
 * fields because the type disallows them.
 */
export type ArtistProfilePatch =
  | { kind: "artist_self_patch"; fields: ArtistSelfPatchableFields }
  | { kind: "admin_patch"; artistId: number; fields: AdminPatchableFields };

export type ArtistProfilePatchFailureCode =
  | "not_a_string"
  | "not_a_boolean"
  | "bio_too_long"
  | "bio_excerpt_too_long"
  | "instagram_handle_invalid"
  | "styles_too_many"
  | "styles_not_an_array"
  | "styles_unknown_value"
  | "unknown_locale"
  | "artist_not_found"
  | "field_not_editable_by_artist"
  | "persist_failed";

export type ArtistProfilePatchResult =
  | { ok: true }
  | { ok: false; failureCode: ArtistProfilePatchFailureCode; detail: string };

/**
 * Entry point. Resolves the target artist id from the actor (artist actors
 * are pinned to their own id; admins pass a target explicitly), validates
 * the patch, writes the artist row and any translation rows in sequence.
 *
 * Not wrapped in a transaction. D1 does not expose transactions across
 * multiple `.run()` calls; a batch() would linearize them but at the cost
 * of losing per-statement error mapping, and the failure mode of "artist
 * row written, translation row not" is recoverable (retry the save; both
 * writes are idempotent for the same input). Acceptable at this scale.
 */
export async function applyArtistProfilePatch({
  database,
  actor,
  patch,
}: {
  database: D1Database;
  actor: Exclude<Actor, { kind: "unknown" }>;
  patch: ArtistProfilePatch;
}): Promise<ArtistProfilePatchResult> {
  const targetArtistIdResult = resolveTargetArtistId({ actor, patch });

  if (!targetArtistIdResult.ok) {
    return targetArtistIdResult;
  }

  const validationResult = validatePatchFields(patch);

  if (!validationResult.ok) {
    return validationResult;
  }

  const { writableFields, translationsByLocale } = validationResult;

  try {
    if (hasWritableFields(writableFields)) {
      const updateResult = await updateArtistProfileFields({
        database,
        artistId: targetArtistIdResult.artistId,
        fields: writableFields,
      });

      if (!updateResult.rowMatched) {
        return {
          ok: false,
          failureCode: "artist_not_found",
          detail: "Target artist row does not exist.",
        };
      }
    }

for (const [locale, translation] of translationsByLocale) {
  await upsertArtistTranslation({
    database,
    artistId: targetArtistIdResult.artistId,
    locale,
    bio: translation.bio,
    bioExcerpt: translation.bioExcerpt,
  });
}

    return { ok: true };
  } catch (persistError) {
    console.error("[artistProfilePatch] persist failed:", persistError);
    return {
      ok: false,
      failureCode: "persist_failed",
      detail: "Could not save the profile changes.",
    };
  }
}

type ResolveTargetArtistIdResult =
  | { ok: true; artistId: number }
  | { ok: false; failureCode: "field_not_editable_by_artist"; detail: string };

/**
 * The invariant: artists write to themselves; admins target explicitly.
 * If an artist patch reaches here from an admin_patch, or vice versa, the
 * route wired the wrong branch — fail defensively.
 */
function resolveTargetArtistId({
  actor,
  patch,
}: {
  actor: Exclude<Actor, { kind: "unknown" }>;
  patch: ArtistProfilePatch;
}): ResolveTargetArtistIdResult {
  if (patch.kind === "artist_self_patch") {
    if (actor.kind !== "artist") {
      return {
        ok: false,
        failureCode: "field_not_editable_by_artist",
        detail: "Non-artist actor sent an artist-self patch.",
      };
    }
    return { ok: true, artistId: actor.artistId };
  }

  if (actor.kind !== "admin") {
    return {
      ok: false,
      failureCode: "field_not_editable_by_artist",
      detail: "Non-admin actor sent an admin patch.",
    };
  }

  return { ok: true, artistId: patch.artistId };
}

type ValidationSuccess = {
  ok: true;
  writableFields: ArtistProfileWritableFields;
  translationsByLocale: Map<
    SupportedLocale,
    { bio?: string | null; bioExcerpt?: string | null }
  >;
};

type ValidationFailure = {
  ok: false;
  failureCode: ArtistProfilePatchFailureCode;
  detail: string;
};

/**
 * Turns a patch's flat fields into (a) the shape the artists-row repository
 * wants and (b) a per-locale translations map. Every path returns early on
 * the first validation error; the endpoint reports one code, not a batch.
 * Batching would be nicer UX in a form but adds complexity that only pays
 * off if the form doesn't validate client-side too — which it will.
 */
function validatePatchFields(
  patch: ArtistProfilePatch,
): ValidationSuccess | ValidationFailure {
  const writableFields: ArtistProfileWritableFields = {};
  const translationsByLocale = new Map
  <
    SupportedLocale,
    { bio?: string | null; bioExcerpt?: string | null }
  >();

  const sharedFields = patch.fields;

  if (sharedFields.instagramHandle !== undefined) {
    if (sharedFields.instagramHandle === null) {
      writableFields.instagramHandle = null;
    } else if (!INSTAGRAM_HANDLE_PATTERN.test(sharedFields.instagramHandle)) {
      return failWith(
        "instagram_handle_invalid",
        "Instagram handle failed format check.",
      );
    } else {
      writableFields.instagramHandle = sharedFields.instagramHandle;
    }
  }

  if (sharedFields.isActive !== undefined) {
    if (typeof sharedFields.isActive !== "boolean") {
      return failWith("not_a_boolean", "isActive must be a boolean.");
    }
    writableFields.isActive = sharedFields.isActive;
  }

  if (sharedFields.styles !== undefined) {
    const stylesResult = validateStyles(sharedFields.styles);
    if (!stylesResult.ok) {
      return stylesResult;
    }
    writableFields.styles = stylesResult.styles;
  }

  const bioMergeResult = mergeTranslationField({
    perLocale: sharedFields.bioByLocale,
    fieldName: "bio",
    maxLength: MAX_BIO_LENGTH,
    tooLongCode: "bio_too_long",
    translationsByLocale,
  });
  if (!bioMergeResult.ok) return bioMergeResult;

  const excerptMergeResult = mergeTranslationField({
    perLocale: sharedFields.bioExcerptByLocale,
    fieldName: "bioExcerpt",
    maxLength: MAX_BIO_EXCERPT_LENGTH,
    tooLongCode: "bio_excerpt_too_long",
    translationsByLocale,
  });
  if (!excerptMergeResult.ok) return excerptMergeResult;

  // Admin-only fields are read only when the patch kind says they're
  // allowed. An artist actor cannot reach this branch, so a stray `slug`
  // on an artist_self_patch is silently ignored — never validated, never
  // written. The type-level union is backed up by a runtime check on the
  // discriminator.
  if (patch.kind === "admin_patch") {
    const adminFields = patch.fields;

    if (adminFields.slug !== undefined) {
      if (typeof adminFields.slug !== "string") {
        return failWith("not_a_string", "slug must be a string.");
      }
      writableFields.slug = adminFields.slug;
    }

    if (adminFields.displayName !== undefined) {
      if (typeof adminFields.displayName !== "string") {
        return failWith("not_a_string", "displayName must be a string.");
      }
      writableFields.displayName = adminFields.displayName;
    }

    if (adminFields.role !== undefined) {
      writableFields.role = adminFields.role;
    }

    if (adminFields.email !== undefined) {
      if (typeof adminFields.email !== "string") {
        return failWith("not_a_string", "email must be a string.");
      }
      writableFields.email = adminFields.email;
    }
  }

  return { ok: true, writableFields, translationsByLocale };
}

function validateStyles(
  styles: unknown,
):
  | { ok: true; styles: string[] }
  | ValidationFailure {
  if (!Array.isArray(styles)) {
    return failWith("styles_not_an_array", "styles must be an array of strings.");
  }

  if (styles.length > MAX_STYLES) {
    return failWith(
      "styles_too_many",
      `A profile may list at most ${MAX_STYLES} styles.`,
    );
  }

  const validatedStyles: string[] = [];

  for (const style of styles) {
    if (typeof style !== "string") {
      return failWith("not_a_string", "Each style must be a string.");
    }
    if (!isArtistStyle(style)) {
      return failWith(
        "styles_unknown_value",
        `Style "${style}" is not in the vocabulary.`,
      );
    }
    validatedStyles.push(style);
  }

  return { ok: true, styles: validatedStyles };
}


const SUPPORTED_LOCALES: readonly SupportedLocale[] = ["en", "lt"];

function isSupportedLocale(candidate: string): candidate is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(candidate);
}

/**
 * Bio and excerpt share this merge path — they're structurally identical
 * (per-locale, nullable, length-capped). Rather than repeat the loop, one
 * function merges either into the translations map keyed by locale.
 */
function mergeTranslationField({
  perLocale,
  fieldName,
  maxLength,
  tooLongCode,
  translationsByLocale,
}: {
  perLocale: Partial<Record<SupportedLocale, string | null>> | undefined;
  fieldName: "bio" | "bioExcerpt";
  maxLength: number;
  tooLongCode: "bio_too_long" | "bio_excerpt_too_long";
  translationsByLocale: Map<
    SupportedLocale,
    { bio?: string | null; bioExcerpt?: string | null }
  >;
}): { ok: true } | ValidationFailure {
  if (perLocale === undefined) {
    return { ok: true };
  }

  for (const [rawLocale, rawValue] of Object.entries(perLocale)) {
    if (!isSupportedLocale(rawLocale)) {
      return failWith(
        "unknown_locale",
        `Locale "${rawLocale}" is not supported.`,
      );
    }

    if (rawValue !== null && typeof rawValue !== "string") {
      return failWith(
        "not_a_string",
        `${fieldName} for ${rawLocale} must be a string or null.`,
      );
    }

    if (rawValue !== null && rawValue.length > maxLength) {
      return failWith(
        tooLongCode,
        `${fieldName} for ${rawLocale} exceeds ${maxLength} characters.`,
      );
    }

    // Merge into whatever the sibling field already wrote (or an empty
    // object). Untouched fields stay `undefined`, which the repository
    // reads as "don't write this column." That is what makes partial
    // translations correct — patching only bio does not blank excerpt.
    const existing = translationsByLocale.get(rawLocale) ?? {};
    existing[fieldName] = rawValue;
    translationsByLocale.set(rawLocale, existing);
  }

  return { ok: true };
}

function hasWritableFields(fields: ArtistProfileWritableFields): boolean {
  return Object.values(fields).some((value) => value !== undefined);
}

function failWith(
  failureCode: ArtistProfilePatchFailureCode,
  detail: string,
): ValidationFailure {
  return { ok: false, failureCode, detail };
}

/**
 * Route-action-callable wrapper around `applyArtistProfilePatch`. Parses the
 * request body, constructs a typed patch, delegates to the service, returns a
 * ready-to-return Response.
 *
 * Called from every route action that mutates artist profiles: /admin/me for
 * artist self-service, /admin/artists/:id for the admin editor (step 4). Both
 * routes' actions are one-line delegations to this function.
 *
 * The route already resolved the actor (its loader and action both do so). We
 * take the resolved actor as a parameter rather than resolving it here — the
 * route may want to make decisions about the actor before delegating (e.g., an
 * artist reaching the admin editor should get 403'd before we even parse the
 * body).
 */
export async function handleArtistProfilePatchRequest({
  request,
  database,
  actor,
}: {
  request: Request;
  database: D1Database;
  actor: Exclude<Actor, { kind: "unknown" }>;
}): Promise<Response> {
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return envelopeReject("invalid_body", "Request body was not valid JSON.", 400);
  }

  const patchResult = buildPatchFromBody({ actor, body: parsedBody });

  if (!patchResult.ok) {
    return envelopeReject(patchResult.failureCode, patchResult.detail, 400);
  }

  const applyResult = await applyArtistProfilePatch({
    database,
    actor,
    patch: patchResult.patch,
  });

  if (!applyResult.ok) {
    return Response.json(applyResult, {
      status: FAILURE_STATUS[applyResult.failureCode],
    });
  }

  return Response.json(applyResult);
}

const FAILURE_STATUS: Record<ArtistProfilePatchFailureCode, number> = {
  not_a_string: 400,
  not_a_boolean: 400,
  bio_too_long: 400,
  bio_excerpt_too_long: 400,
  instagram_handle_invalid: 400,
  styles_not_an_array: 400,
  styles_too_many: 400,
  styles_unknown_value: 400,
  unknown_locale: 400,
  artist_not_found: 404,
  field_not_editable_by_artist: 403,
  persist_failed: 500,
};

/**
 * Envelope-level rejection (JSON body was malformed, missing envelope fields,
 * etc.). Distinct from service-level `ArtistProfilePatchResult` failures —
 * the code here is `string`, not the typed union, because the envelope layer
 * knows failures the service never sees ("invalid_body", "invalid_artist_id").
 */
function envelopeReject(
  failureCode: string,
  detail: string,
  status: number,
): Response {
  return Response.json({ ok: false, failureCode, detail }, { status });
}

type BuildPatchResult =
  | { ok: true; patch: ArtistProfilePatch }
  | { ok: false; failureCode: string; detail: string };

function buildPatchFromBody({
  actor,
  body,
}: {
  actor: Exclude<Actor, { kind: "unknown" }>;
  body: unknown;
}): BuildPatchResult {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      failureCode: "invalid_body",
      detail: "Request body must be an object.",
    };
  }

  const bodyRecord = body as Record<string, unknown>;
  const fieldsCandidate = bodyRecord.fields;

  if (typeof fieldsCandidate !== "object" || fieldsCandidate === null) {
    return {
      ok: false,
      failureCode: "invalid_body",
      detail: "Body must include a `fields` object.",
    };
  }

  if (actor.kind === "artist") {
    return {
      ok: true,
      patch: {
        kind: "artist_self_patch",
        fields: fieldsCandidate as ArtistSelfPatchableFields,
      },
    };
  }

  const rawArtistId = bodyRecord.artistId;

  if (
    typeof rawArtistId !== "number" ||
    !Number.isInteger(rawArtistId) ||
    rawArtistId <= 0
  ) {
    return {
      ok: false,
      failureCode: "invalid_artist_id",
      detail: "Admin patch must include a numeric artistId.",
    };
  }

  return {
    ok: true,
    patch: {
      kind: "admin_patch",
      artistId: rawArtistId,
      fields: fieldsCandidate as AdminPatchableFields,
    },
  };
}