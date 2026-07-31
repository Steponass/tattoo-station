// app/routes/api.artist-photos.reorder.ts

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import { isArtistPhotoCategory } from "~/lib/artists/artistPhotoCategories";
import {
  reorderArtistPhotos,
  type ReorderArtistPhotosFailureCode,
} from "~/lib/artists/reorderArtistPhotos.server";
import type { Route } from "./+types/api.artist-photos.reorder";

/**
 * Rewrites the order of an artist's photos in one category.
 *
 * Artist-only. Admins do not use this endpoint — profile grids are
 * "controlled by artist (own)" per §5 of the handoff. Admins reorder rosters
 * and curated galleries via separate endpoints in steps 3 and 4.
 *
 * Actor-pinned: the target artistId is derived from the actor, never from the
 * body. The body carries only the category being reordered and the id list.
 * The service performs the exact-set-match validation and the atomic batch
 * rewrite; this action is envelope parsing plus a delegation.
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
    return reject("wrong_actor", "Only artists reorder their own photos.", 403);
  }

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

  const artistProfile = await findArtistProfileForEditing({
    database: env.DB,
    artistId: actor.artistId,
  });

  if (artistProfile === null) {
    // The actor resolved as an artist (email matched a D1 row) but the row
    // has since disappeared. Same race guard as /admin/me's loader; fail
    // closed rather than reorder against a stale identity.
    return reject("artist_not_found", "Your account could not be found.", 404);
  }

  const reorderResult = await reorderArtistPhotos({
    database: env.DB,
    artistId: actor.artistId,
    artistRole: artistProfile.role,
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
    }
  | { ok: false; failureCode: string; detail: string };

/**
 * Parses and shape-validates the JSON envelope. Field-level validation (the
 * set-exact-match rules) is the service's job; this function only ensures
 * the shape is what the service expects.
 */
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
  };
}
