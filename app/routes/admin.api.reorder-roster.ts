// app/routes/api.reorder-roster.ts

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import {
  reorderRoster,
  type ReorderRosterFailureCode,
} from "~/lib/artists/reorderRoster.server";
import type { Route } from "../+types/api.reorder-roster";

/**
 * Admin-only. Rewrites the sort_order on artists.
 *
 * The route action is envelope parsing plus a delegation to the service. The
 * exact-set-match validation and D1 write live in the service; the route
 * only enforces envelope shape.
 */

const FAILURE_STATUS: Record<ReorderRosterFailureCode, number> = {
  invalid_ordered_ids: 400,
  reorder_wrong_count: 409,
  reorder_unknown_ids: 409,
  reorder_missing_ids: 409,
  reorder_duplicate_ids: 400,
  persist_failed: 500,
};

function reject(
  failureCode: string,
  detail: string,
  status: number,
): Response {
  return Response.json({ ok: false, failureCode, detail }, { status });
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);

  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return reject("forbidden", "Authentication required.", 403);
  }

  if (actor.kind !== "admin") {
    return reject("wrong_actor", "Only admins reorder the roster.", 403);
  }

  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return reject("invalid_body", "Request body was not valid JSON.", 400);
  }

  const orderedIdsResult = parseOrderedArtistIds(parsedBody);

  if (!orderedIdsResult.ok) {
    return reject(orderedIdsResult.failureCode, orderedIdsResult.detail, 400);
  }

  const reorderResult = await reorderRoster({
    database: env.DB,
    orderedArtistIds: orderedIdsResult.orderedArtistIds,
  });

  if (!reorderResult.ok) {
    return Response.json(reorderResult, {
      status: FAILURE_STATUS[reorderResult.failureCode],
    });
  }

  return Response.json(reorderResult);
}

type OrderedIdsParseResult =
  | { ok: true; orderedArtistIds: number[] }
  | { ok: false; failureCode: string; detail: string };

function parseOrderedArtistIds(body: unknown): OrderedIdsParseResult {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      failureCode: "invalid_body",
      detail: "Request body must be an object.",
    };
  }

  const bodyRecord = body as Record<string, unknown>;
  const rawOrderedIds = bodyRecord.orderedArtistIds;

  if (!Array.isArray(rawOrderedIds)) {
    return {
      ok: false,
      failureCode: "invalid_ordered_ids",
      detail: "orderedArtistIds must be an array.",
    };
  }

  const parsedIds: number[] = [];

  for (const rawId of rawOrderedIds) {
    if (
      typeof rawId !== "number" ||
      !Number.isInteger(rawId) ||
      rawId <= 0
    ) {
      return {
        ok: false,
        failureCode: "invalid_ordered_ids",
        detail: "Each artist id must be a positive integer.",
      };
    }
    parsedIds.push(rawId);
  }

  return { ok: true, orderedArtistIds: parsedIds };
}