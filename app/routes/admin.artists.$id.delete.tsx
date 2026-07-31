// app/routes/admin.artists.$id.delete.tsx

import { redirect } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import {
  deleteArtist,
  type DeleteArtistFailureCode,
} from "~/lib/artists/deleteArtist.server";
import type { Route } from "./+types/admin.artists.$id.delete";

/**
 * Admin-only delete for a single artist. Action-only route: no default
 * export, no UI at this URL. The typed-confirmation UI lives on the edit
 * page (/admin/artists/:id); this route just performs the delete.
 *
 * On success, redirects to /admin?deleted=<displayName> so the dashboard
 * can render a confirmation. On failure, returns JSON — the client shows
 * the error inline on the edit page.
 */

const FAILURE_STATUS: Record<DeleteArtistFailureCode, number> = {
  artist_not_found: 404,
  d1_delete_failed: 500,
};

function reject(
  failureCode: string,
  detail: string,
  status: number,
): Response {
  return Response.json({ ok: false, failureCode, detail }, { status });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return reject("forbidden", "Authentication required.", 403);
  }

  if (actor.kind !== "admin") {
    return reject("wrong_actor", "Only admins can delete artists.", 403);
  }

  const targetArtistId = parseArtistIdFromParam(params.id);

  if (targetArtistId === null) {
    return reject("invalid_artist_id", "Invalid artist id in URL.", 400);
  }

  const deleteResult = await deleteArtist({
    database: env.DB,
    mediaBucket: env.MEDIA,
    artistId: targetArtistId,
  });

  if (!deleteResult.ok) {
    return Response.json(deleteResult, {
      status: FAILURE_STATUS[deleteResult.failureCode],
    });
  }

  // Log the sweep result server-side for observability. The client only
  // needs to know it succeeded.
  console.info(
    `[deleteArtist] Deleted "${deleteResult.displayName}" (id ${targetArtistId}). ` +
      `R2 sweep: ${deleteResult.r2ObjectsSwept} succeeded, ${deleteResult.r2ObjectsFailed} failed.`,
  );

  const encodedDisplayName = encodeURIComponent(deleteResult.displayName);
  return redirect(`/admin?deleted=${encodedDisplayName}`);
}

function parseArtistIdFromParam(rawParam: string | undefined): number | null {
  if (rawParam === undefined) {
    return null;
  }

  const parsed = Number(rawParam);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}