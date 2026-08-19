import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { adminActorContext } from "~/lib/admin/server/adminActorContext.server";
import { reject } from "~/lib/admin/server/actionResponses.server";
import type { ResolvedActor } from "~/lib/admin/server/resolveActor.server";
import { isArtistStyle, type ArtistStyle } from "~/lib/artists/artistStyles";
import {
  updateArtistPhotoStyle,
  type UpdateArtistPhotoStyleFailureCode,
} from "~/lib/artists/updateArtistPhotoStyle.server";
import type { Route } from "./+types/admin.api.artist-photos.style";

/*
 * Changes the style tag on a photo. Reachable by both admins (targeting any
 * artist via the body) and artists (pinned to themselves)
 */

const FAILURE_STATUS: Record<UpdateArtistPhotoStyleFailureCode, number> = {
  photo_not_found: 404,
  d1_update_failed: 500,
};

type ResolveTargetArtistIdResult =
  | { ok: true; artistId: number }
  | { ok: false; failureCode: "invalid_artist_id" };

function resolveTargetArtistId({
  actor,
  body,
}: {
  actor: ResolvedActor;
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
  const actor = context.get(adminActorContext);

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

  const styleResult = parseStyle(bodyRecord.style);

  if (!styleResult.ok) {
    return reject("invalid_style", "The style tag is not a recognized style.", 400);
  }

  const updateResult = await updateArtistPhotoStyle({
    database: env.DB,
    artistId: targetArtistIdResult.artistId,
    photoId: photoIdResult.photoId,
    style: styleResult.style,
  });

  if (!updateResult.ok) {
    return Response.json(updateResult, {
      status: FAILURE_STATUS[updateResult.failureCode],
    });
  }

  return Response.json(updateResult);
}

type PhotoIdParseResult =
  | { ok: true; photoId: number }
  | { ok: false; failureCode: string; detail: string };

function parsePhotoId(body: Record<string, unknown>): PhotoIdParseResult {
  const rawPhotoId = body.photoId;

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

type StyleParseResult =
  | { ok: true; style: ArtistStyle | null }
  | { ok: false };

/*
 * Absent, null, or empty string all mean "unsorted".
 * Anything else must match the canonical vocabulary.
 */
function parseStyle(rawValue: unknown): StyleParseResult {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return { ok: true, style: null };
  }

  if (typeof rawValue !== "string" || !isArtistStyle(rawValue)) {
    return { ok: false };
  }

  return { ok: true, style: rawValue };
}
