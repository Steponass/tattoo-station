// app/routes/api.artist-photos.delete.ts

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import {
  deleteArtistPhoto,
  type DeleteArtistPhotoFailureCode,
} from "~/lib/artists/deleteArtistPhoto.server";
import type { Route } from "./+types/api.artist-photos.delete";

/**
 * Deletes one of the caller's photos. Artist-only, actor-pinned — the artist
 * id is derived from the actor, never from the body, and non-artist callers
 * are rejected.
 *
 * The body carries only `photoId`. Ownership (photo belongs to this artist)
 * is enforced by the service's D1 read, which is scoped by both photo id and
 * artist id; the same "photo_not_found" code covers both "doesn't exist" and
 * "not yours" so callers can't enumerate photo ids.
 */

const FAILURE_STATUS: Record<DeleteArtistPhotoFailureCode, number> = {
  photo_not_found: 404,
  d1_delete_failed: 500,
};

function reject(failureCode: string, detail: string, status: number): Response {
  return Response.json({ ok: false, failureCode, detail }, { status });
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);

  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return reject("forbidden", "Authentication required.", 403);
  }

  if (actor.kind !== "artist") {
    return reject("wrong_actor", "Only artists delete their own photos.", 403);
  }

  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return reject("invalid_body", "Request body was not valid JSON.", 400);
  }

  const photoIdResult = parsePhotoId(parsedBody);

  if (!photoIdResult.ok) {
    return reject(photoIdResult.failureCode, photoIdResult.detail, 400);
  }

  const deleteResult = await deleteArtistPhoto({
    database: env.DB,
    mediaBucket: env.MEDIA,
    artistId: actor.artistId,
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
