// app/routes/api.artist-avatar.ts

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor, type Actor } from "~/lib/admin/server/resolveActor.server";
import {
  storeArtistAvatar,
  type StoreArtistAvatarFailureCode,
} from "~/lib/artists/artistAvatar.server";
import type { ArtistAvatarUploadOutcome } from "~/lib/artists/uploadArtistAvatar";
import type { Route } from "./+types/admin.api.artist-avatar";

const MAX_AVATAR_UPLOAD_BYTES = 25 * 1024 * 1024;

const FAILURE_STATUS: Record<StoreArtistAvatarFailureCode, number> = {
  artist_not_found: 404,
  unreadable_image: 422,
  unsupported_source_format: 422,
  transformation_failed: 422,
  storage_failed: 500,
  persist_failed: 500,
};

type ArtistIdParseResult =
  | { ok: true; artistId: number }
  | { ok: false };

function reject(failureCode: string, detail: string, status: number): Response {
  const outcome: ArtistAvatarUploadOutcome = { ok: false, failureCode, detail };

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
 * Same actor-pinning invariant as the portfolio upload — see the extended
 * comment on `resolveTargetArtistId` in api.artist-photos.ts. Duplicated here
 * rather than shared because the two endpoints are the only current callers
 * and premature extraction would ossify a shape that step 2's new endpoints
 * (reorder-photos, delete-photo, patch-artist-profile) will refine.
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

/**
 * Replaces an artist's avatar: authenticate, validate, normalize, store in R2,
 * repoint the artist row, delete the previous avatar. Reachable to both admins
 * (targeting any artist) and artists (pinned to themselves).
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
    artistId: targetArtistIdResult.artistId,
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