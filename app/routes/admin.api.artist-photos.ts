
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor, type Actor } from "~/lib/admin/server/resolveActor.server";
import {
  storeArtistPhoto,
  type StoreArtistPhotoFailureCode,
} from "~/lib/artists/artistPhotos.server";
import { isArtistStyle, type ArtistStyle } from "~/lib/artists/artistStyles";
import type { ArtistPhotoUploadOutcome } from "~/lib/artists/uploadArtistPhoto";
import type { Route } from "../+types/api.artist-photos";
import { isArtistPhotoCategory } from "~/lib/artists/artistPhotoCategories";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import { mainPhotoCategoryForRole } from "~/lib/artists/artistPhotoCategories";

/**
 * A generous ceiling on the raw upload before normalization. An unbounded
 * arrayBuffer read is a memory-exhaustion vector; a phone HEIC sits well under
 * this.
 */
const MAX_PORTFOLIO_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Maps a service-level failure to the HTTP status the client should see. */
const FAILURE_STATUS: Record<StoreArtistPhotoFailureCode, number> = {
  artist_not_found: 404,
  portfolio_full: 409,
  unreadable_image: 422,
  unsupported_source_format: 422,
  transformation_failed: 422,
  storage_failed: 500,
  persist_failed: 500,
};

type StyleParseResult =
  | { ok: true; style: ArtistStyle | null }
  | { ok: false };

type ArtistIdParseResult =
  | { ok: true; artistId: number }
  | { ok: false };

function reject(failureCode: string, detail: string, status: number): Response {
  const outcome: ArtistPhotoUploadOutcome = { ok: false, failureCode, detail };

  return Response.json(outcome, { status });
}

function parseArtistId(rawValue: FormDataEntryValue | null): ArtistIdParseResult {
  if (typeof rawValue !== "string") {
    return { ok: false };
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { ok: false };
  }

  return { ok: true, artistId: parsed };
}

/**
 * Reads and validates the optional style tag. Absent is valid (photos need not
 * be tagged); present-but-unknown is rejected, so the value can never drift
 * from the canonical vocabulary the gallery groups by.
 */
function parseStyle(rawValue: FormDataEntryValue | null): StyleParseResult {
  if (rawValue === null || rawValue === "") {
    return { ok: true, style: null };
  }

  if (typeof rawValue !== "string" || !isArtistStyle(rawValue)) {
    return { ok: false };
  }

  return { ok: true, style: rawValue };
}

/**
 * Resolves which artist this upload targets, given the resolved caller.
 *
 * The invariant from §3 of the build handoff: every artist-scoped write derives
 * `artistId` from `actor`, never from the form.
 *
 *   - `artist`: the target is always `actor.artistId`. Any form-supplied id is
 *     ignored — an artist cannot upload to another artist's portfolio by
 *     forging the form field.
 *   - `admin`:  the target comes from the form. The admin UI acts on any
 *     artist and must pass a target explicitly.
 *   - `unknown`: never reaches this function; the caller has already rejected
 *     with 403.
 *
 * Returning a discriminated result rather than throwing keeps the action
 * handler's error mapping in one place.
 */
type ResolveTargetArtistIdResult =
  | { ok: true; artistId: number }
  | { ok: false; failureCode: "invalid_artist_id" };

function resolveTargetArtistId({
  actor,
  formData,
}: {
  actor: Exclude<Actor, { kind: "unknown" }>;
  formData: FormData;
}): ResolveTargetArtistIdResult {
  if (actor.kind === "artist") {
    return { ok: true, artistId: actor.artistId };
  }

  const parseResult = parseArtistId(formData.get("artistId"));

  if (!parseResult.ok) {
    return { ok: false, failureCode: "invalid_artist_id" };
  }

  return { ok: true, artistId: parseResult.artistId };
}

type ResolveTargetCategoryResult =
  | {
      ok: true;
      category: import("~/lib/artists/artistPhotoCategories").ArtistPhotoCategory;
    }
  | {
      ok: false;
      failureCode: string;
      detail: string;
      status: number;
    };

/**
 * Resolves which category the upload targets, given the resolved caller.
 *
 * Artist: category is derived server-side from the artist's role AND the
 *   `surface` field the UI passes ("main" or "flash"). The artist UI never
 *   sends a category; §6 of the handoff: "The upload UI never asks for
 *   category." Missing surface defaults to "main" for backwards compatibility
 *   with the /admin/me/photos page written before this endpoint knew about
 *   surfaces.
 *
 *   - surface=main → mainPhotoCategoryForRole(role) → "tattoo" or "piercing"
 *   - surface=flash → literal "flash", allowed only for tattoo/both roles.
 *     Piercer trying to upload flash is a UI bug or an attack; either way,
 *     rejected here.
 *
 * Admin: category comes from the form as before. Admins may upload to any of
 *   the three categories for any artist; the surface concept doesn't apply.
 */
async function resolveTargetCategory({
  actor,
  formData,
  database,
  targetArtistId,
}: {
  actor: Exclude<Actor, { kind: "unknown" }>;
  formData: FormData;
  database: D1Database;
  targetArtistId: number;
}): Promise<ResolveTargetCategoryResult> {
  if (actor.kind === "artist") {
    const artistProfile = await findArtistProfileForEditing({
      database,
      artistId: targetArtistId,
    });

    if (artistProfile === null) {
      return {
        ok: false,
        failureCode: "artist_not_found",
        detail: "Your account could not be found.",
        status: 404,
      };
    }

    const surfaceValue = formData.get("surface");
    const surface =
      typeof surfaceValue === "string" ? surfaceValue : "main";

    if (surface === "main") {
      return {
        ok: true,
        category: mainPhotoCategoryForRole(artistProfile.role),
      };
    }

    if (surface === "flash") {
      if (artistProfile.role === "piercing") {
        return {
          ok: false,
          failureCode: "surface_not_available_for_role",
          detail: "Flash uploads aren't available for your role.",
          status: 403,
        };
      }
      return { ok: true, category: "flash" };
    }

    return {
      ok: false,
      failureCode: "invalid_surface",
      detail: "Surface must be 'main' or 'flash'.",
      status: 400,
    };
  }

  const categoryValue = formData.get("category");

  if (typeof categoryValue !== "string" || !isArtistPhotoCategory(categoryValue)) {
    return {
      ok: false,
      failureCode: "invalid_category",
      detail: "A valid photo category is required.",
      status: 400,
    };
  }

  return { ok: true, category: categoryValue };
}

/**
 * Creates one portfolio photo: authenticate, validate, normalize, store in R2,
 * record in D1.
 *
 * The endpoint is reachable to both admins (targeting any artist via the form)
 * and artists (pinned to themselves). The actor kind is the only thing that
 * decides which; the rest of the pipeline is identical.
 */
export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);

  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return reject("forbidden", "Authentication required.", 403);
  }

  const formData = await request.formData();

  const targetArtistIdResult = resolveTargetArtistId({ actor, formData });

  if (!targetArtistIdResult.ok) {
    return reject(
      targetArtistIdResult.failureCode,
      "Missing or malformed artist id.",
      400,
    );
  }

  const categoryResult = await resolveTargetCategory({
    actor,
    formData,
    database: env.DB,
    targetArtistId: targetArtistIdResult.artistId,
  });

  if (!categoryResult.ok) {
    return reject(categoryResult.failureCode, categoryResult.detail, categoryResult.status);
  }

  const uploadedFile = formData.get("photo");

  if (!(uploadedFile instanceof File)) {
    return reject("missing_file", "No photo was received.", 400);
  }

  const styleResult = parseStyle(formData.get("style"));

  if (!styleResult.ok) {
    return reject("invalid_style", "The style tag is not a recognized style.", 400);
  }

  const sourceBytes = await uploadedFile.arrayBuffer();

  if (sourceBytes.byteLength === 0) {
    return reject("empty_file", "The uploaded file is empty.", 400);
  }

  if (sourceBytes.byteLength > MAX_PORTFOLIO_UPLOAD_BYTES) {
    return reject("file_too_large", "The file is too large.", 413);
  }

  const storeResult = await storeArtistPhoto({
    images: env.IMAGES,
    mediaBucket: env.MEDIA,
    database: env.DB,
    artistId: targetArtistIdResult.artistId,
    category: categoryResult.category,
    style: styleResult.style,
    sourceBytes,
  });

  if (!storeResult.ok) {
    console.error(
      "[artist-photos] store failed:",
      storeResult.failureCode,
      storeResult.detail,
    );

    return reject(
      storeResult.failureCode,
      "The photo could not be processed.",
      FAILURE_STATUS[storeResult.failureCode],
    );
  }

  const outcome: ArtistPhotoUploadOutcome = { ok: true, photo: storeResult.photo };

  return Response.json(outcome);
}