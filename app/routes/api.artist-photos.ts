// app/routes/api.artist-photos.ts

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { requireAdmin } from "~/lib/admin/server/requireAdmin.server";
import {
  storeArtistPhoto,
  type StoreArtistPhotoFailureCode,
} from "~/lib/artists/artistPhotos.server";
import { isArtistStyle } from "~/lib/artists/artistStyles";
import type { ArtistPhotoUploadOutcome } from "~/lib/artists/uploadArtistPhoto";
import type { Route } from "./+types/api.artist-photos";
import { isArtistPhotoCategory } from "~/lib/artists/artistPhotoCategories";

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

function reject(failureCode: string, detail: string, status: number): Response {
  const outcome: ArtistPhotoUploadOutcome = { ok: false, failureCode, detail };

  return Response.json(outcome, { status });
}

function parseArtistId(rawValue: FormDataEntryValue | null): number | null {
  if (typeof rawValue !== "string") {
    return null;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
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
 * Creates one portfolio photo for an artist: authenticate, validate, normalize,
 * store in R2, record in D1.
 *
 * Admin-only. In production the Cloudflare Access JWT is verified; locally the
 * check is stubbed (see requireAdmin), since Access does not front `wrangler dev`.
 */
export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);

  const adminOutcome = await requireAdmin(request, env);

  if (!adminOutcome.ok) {
    return reject(adminOutcome.failureCode, "Admin authentication required.", 403);
  }

  const formData = await request.formData();

  const artistId = parseArtistId(formData.get("artistId"));

  if (artistId === null) {
    return reject("invalid_artist_id", "Missing or malformed artist id.", 400);
  }

  const categoryValue = formData.get("category");

  if (typeof categoryValue !== "string" || !isArtistPhotoCategory(categoryValue)) {
    return reject("invalid_category", "A valid photo category is required.", 400);
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
    artistId,
    category: categoryValue,
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