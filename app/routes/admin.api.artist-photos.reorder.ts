import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { adminActorContext } from "~/lib/admin/server/adminActorContext.server";
import { reject } from "~/lib/admin/server/actionResponses.server";
import type { ResolvedActor } from "~/lib/admin/server/resolveActor.server";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import { isArtistPhotoCategory } from "~/lib/artists/artistPhotoCategories";
import {
  reorderArtistPhotos,
  type ReorderArtistPhotosCategoryGate,
  type ReorderArtistPhotosFailureCode,
} from "~/lib/artists/reorderArtistPhotos.server";
import type { Route } from "./+types/admin.api.artist-photos.reorder";

/*
 * Rewrites the order of an artist's photos in one category.
 *
 * Reachable by both admins (targeting any artist via the body) and artists
 * (pinned to themselves) — same actor-pinning invariant as
 * api.artist-photos.ts's upload endpoint.
 */

const FAILURE_STATUS: Record<ReorderArtistPhotosFailureCode, number> = {
  invalid_ordered_ids: 400,
  invalid_category: 400,
  category_not_editable_by_artist: 403,
  reorder_wrong_count: 409,
  reorder_unknown_ids: 409,
  reorder_missing_ids: 409,
  reorder_duplicate_ids: 400,
  persist_failed: 500,
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

  const envelopeResult = parseReorderEnvelope(parsedBody);

  if (!envelopeResult.ok) {
    return reject(envelopeResult.failureCode, envelopeResult.detail, 400);
  }

  const targetArtistIdResult = resolveTargetArtistId({
    actor,
    body: envelopeResult.body,
  });

  if (!targetArtistIdResult.ok) {
    return reject(
      targetArtistIdResult.failureCode,
      "Missing or malformed artist id.",
      400,
    );
  }

  let categoryGate: ReorderArtistPhotosCategoryGate;

  if (actor.kind === "artist") {
    const artistProfile = await findArtistProfileForEditing({
      database: env.DB,
      artistId: actor.artistId,
    });

    if (artistProfile === null) {
      return reject("artist_not_found", "Your account could not be found.", 404);
    }

    categoryGate = { kind: "artist", artistRole: artistProfile.role };
  } else {
    categoryGate = { kind: "admin" };
  }

  const reorderResult = await reorderArtistPhotos({
    database: env.DB,
    artistId: targetArtistIdResult.artistId,
    categoryGate,
    category: envelopeResult.category,
    orderedPhotoIds: envelopeResult.orderedPhotoIds,
  });

  if (!reorderResult.ok) {
    return Response.json(reorderResult, {
      status: FAILURE_STATUS[reorderResult.failureCode],
    });
  }

  return Response.json(reorderResult);
}

type EnvelopeParseResult =
  | {
      ok: true;
      category: import("~/lib/artists/artistPhotoCategories").ArtistPhotoCategory;
      orderedPhotoIds: number[];
      body: Record<string, unknown>;
    }
  | { ok: false; failureCode: string; detail: string };

function parseReorderEnvelope(body: unknown): EnvelopeParseResult {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      failureCode: "invalid_body",
      detail: "Request body must be an object.",
    };
  }

  const bodyRecord = body as Record<string, unknown>;

  const rawCategory = bodyRecord.category;

  if (typeof rawCategory !== "string" || !isArtistPhotoCategory(rawCategory)) {
    return {
      ok: false,
      failureCode: "invalid_category",
      detail: "A valid photo category is required.",
    };
  }

  const rawOrderedIds = bodyRecord.orderedPhotoIds;

  if (!Array.isArray(rawOrderedIds)) {
    return {
      ok: false,
      failureCode: "invalid_ordered_ids",
      detail: "orderedPhotoIds must be an array.",
    };
  }

  const parsedIds: number[] = [];

  for (const rawId of rawOrderedIds) {
    if (typeof rawId !== "number" || !Number.isInteger(rawId) || rawId <= 0) {
      return {
        ok: false,
        failureCode: "invalid_ordered_ids",
        detail: "Each ordered id must be a positive integer.",
      };
    }
    parsedIds.push(rawId);
  }

  return {
    ok: true,
    category: rawCategory,
    orderedPhotoIds: parsedIds,
    body: bodyRecord,
  };
}