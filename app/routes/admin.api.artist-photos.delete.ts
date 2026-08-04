// app/routes/api.artist-photos.delete.ts

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor, type Actor } from "~/lib/admin/server/resolveActor.server";
import {
  deleteArtistPhoto,
  type DeleteArtistPhotoFailureCode,
} from "~/lib/artists/deleteArtistPhoto.server";
import type { Route } from "./+types/admin.api.artist-photos.delete";

/**
 * Deletes a photo. Reachable by both admins (targeting any artist via the
 * body) and artists (pinned to themselves) — same actor-pinning invariant as
 * api.artist-photos.ts's upload endpoint.
 *
 * The body carries `photoId` and, for admin callers only, `artistId`.
 * Ownership (photo belongs to the target artist) is enforced by the
 * service's D1 read, which is scoped by both photo id and artist id; the
 * same "photo_not_found" code covers both "doesn't exist" and "not yours" so
 * callers can't enumerate photo ids.
 */

const FAILURE_STATUS: Record<DeleteArtistPhotoFailureCode, number> = {
  photo_not_found: 404,
  d1_delete_failed: 500,
};

function reject(failureCode: string, detail: string, status: number): Response {
  return Response.json({ ok: false, failureCode, detail }, { status });
}

type ResolveTargetArtistIdResult =
  | { ok: true; artistId: number }
  | { ok: false; failureCode: "invalid_artist_id" };

/**
 * Resolves which artist's photo is being deleted, given the resolved caller.
 * Artist: always their own id, ignoring any body-supplied value. Admin: the
 * id comes from the body, since the admin UI acts on any artist.
 */
function resolveTargetArtistId({
  actor,
  body,
}: {
  actor: Exclude<Actor, { kind: "unknown" }>;
  body: Record<string, unknown>;
}): ResolveTargetArtistIdResult {
  if (actor.kind === "artist") {
    return { ok: true, artistId: actor.artistId };
  }

  const rawArtistId = body.artistId;

  if (
    typeof rawArtistId !== "number" ||
    !Number.isInteger(rawArtistId) ||
    rawArtistId <= 0
  ) {
    return { ok: false, failureCode: "invalid_artist_id" };
  }

  return { ok: true, artistId: rawArtistId };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);

  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return reject("forbidden", "Authentication required.", 403);
  }

  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return reject("invalid_body", "Request body was not valid JSON.", 400);
  }

  if (typeof parsedBody !== "object" || parsedBody === null) {
    return reject("invalid_body", "Request body must be an object.", 400);
  }

  const bodyRecord = parsedBody as Record<string, unknown>;

  const targetArtistIdResult = resolveTargetArtistId({ actor, body: bodyRecord });

  if (!targetArtistIdResult.ok) {
    return reject(
      targetArtistIdResult.failureCode,
      "Missing or malformed artist id.",
      400,
    );
  }

  const photoIdResult = parsePhotoId(bodyRecord);

  if (!photoIdResult.ok) {
    return reject(photoIdResult.failureCode, photoIdResult.detail, 400);
  }

  const deleteResult = await deleteArtistPhoto({
    database: env.DB,
    mediaBucket: env.MEDIA,
    artistId: targetArtistIdResult.artistId,
    photoId: photoIdResult.photoId,
  });

  if (!deleteResult.ok) {
    return Response.json(deleteResult, {
      status: FAILURE_STATUS[deleteResult.failureCode],
    });
  }

  return Response.json(deleteResult);
}

type PhotoIdParseResult =
  | { ok: true; photoId: number }
  | { ok: false; failureCode: string; detail: string };

function parsePhotoId(body: unknown): PhotoIdParseResult {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      failureCode: "invalid_body",
      detail: "Request body must be an object.",
    };
  }

  const bodyRecord = body as Record<string, unknown>;
  const rawPhotoId = bodyRecord.photoId;

  if (
    typeof rawPhotoId !== "number" ||
    !Number.isInteger(rawPhotoId) ||
    rawPhotoId <= 0
  ) {
    return {
      ok: false,
      failureCode: "invalid_photo_id",
      detail: "photoId must be a positive integer.",
    };
  }

  return { ok: true, photoId: rawPhotoId };
}
