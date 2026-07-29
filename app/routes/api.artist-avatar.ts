// app/routes/api.artist-avatar.ts

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { requireAdmin } from "~/lib/admin/server/requireAdmin.server";
import {
  storeArtistAvatar,
  type StoreArtistAvatarFailureCode,
} from "~/lib/artists/artistAvatar.server";
import type { ArtistAvatarUploadOutcome } from "~/lib/artists/uploadArtistAvatar";
import type { Route } from "./+types/api.artist-avatar";

const MAX_AVATAR_UPLOAD_BYTES = 25 * 1024 * 1024;

const FAILURE_STATUS: Record<StoreArtistAvatarFailureCode, number> = {
  artist_not_found: 404,
  unreadable_image: 422,
  unsupported_source_format: 422,
  transformation_failed: 422,
  storage_failed: 500,
  persist_failed: 500,
};

function reject(failureCode: string, detail: string, status: number): Response {
  const outcome: ArtistAvatarUploadOutcome = { ok: false, failureCode, detail };

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
 * Replaces an artist's avatar: authenticate, validate, normalize, store in R2,
 * repoint the artist row, delete the previous avatar. Admin-only (stubbed in
 * dev, see requireAdmin).
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

  const uploadedFile = formData.get("photo");

  if (!(uploadedFile instanceof File)) {
    return reject("missing_file", "No image was received.", 400);
  }

  const sourceBytes = await uploadedFile.arrayBuffer();

  if (sourceBytes.byteLength === 0) {
    return reject("empty_file", "The uploaded file is empty.", 400);
  }

  if (sourceBytes.byteLength > MAX_AVATAR_UPLOAD_BYTES) {
    return reject("file_too_large", "The file is too large.", 413);
  }

  const storeResult = await storeArtistAvatar({
    images: env.IMAGES,
    mediaBucket: env.MEDIA,
    database: env.DB,
    artistId,
    sourceBytes,
  });

  if (!storeResult.ok) {
    console.error(
      "[artist-avatar] store failed:",
      storeResult.failureCode,
      storeResult.detail,
    );

    return reject(
      storeResult.failureCode,
      "The avatar could not be processed.",
      FAILURE_STATUS[storeResult.failureCode],
    );
  }

  const outcome: ArtistAvatarUploadOutcome = { ok: true, avatar: storeResult.avatar };

  return Response.json(outcome);
}