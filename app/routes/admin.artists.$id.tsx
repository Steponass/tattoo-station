// app/routes/admin.artists.$id.tsx

import { data, Link, redirect } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import { handleArtistProfilePatchRequest } from "~/lib/artists/artistProfilePatch.server";
import ArtistProfileForm from "~/components/admin/profile/ArtistProfileForm";
import type { Route } from "./+types/admin.artists.$id";
import DeleteArtistPanel from "~/components/admin/profile/DeleteArtistPanel";
import styles from "./admin.artists.$id.module.css";

/**
 * The admin's editor for any single artist. Same form as /admin/me, but with
 * `actorKind="admin"` — the four admin-only Identity fields (slug, role,
 * email, displayName) become editable.
 *
 * Actor-pinning: the URL param `id` addresses which artist to edit. The route
 * verifies the target row exists before rendering, and passes the same id
 * into the patch handler as `targetArtistIdOverride` so the form's fetcher
 * doesn't need to know the id — it stays in the URL, the route stays the
 * source of truth.
 *
 * When arriving via /admin/artists/new's redirect, the URL includes
 * ?justCreated=1 and the page renders a reminder to add the artist's email
 * to the Cloudflare Access policy. Dismissible by navigating anywhere else;
 * the reminder is stateless — it lives in the URL, not in a session.
 */
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    throw data("Forbidden", { status: 403 });
  }

  if (actor.kind === "artist") {
    throw redirect("/admin/me");
  }

  const targetArtistId = parseArtistIdFromParam(params.id);

  if (targetArtistId === null) {
    throw data("Not Found", { status: 404 });
  }

  const artistProfile = await findArtistProfileForEditing({
    database: env.DB,
    artistId: targetArtistId,
  });

  if (artistProfile === null) {
    throw data("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const isJustCreated = url.searchParams.get("justCreated") === "1";

  return { artistProfile, isJustCreated, targetArtistId };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return Response.json(
      { ok: false, failureCode: "forbidden", detail: "Authentication required." },
      { status: 403 },
    );
  }

  if (actor.kind === "artist") {
    return Response.json(
      {
        ok: false,
        failureCode: "wrong_route",
        detail: "Artists edit their own profile at /admin/me.",
      },
      { status: 403 },
    );
  }

  const targetArtistId = parseArtistIdFromParam(params.id);

  if (targetArtistId === null) {
    return Response.json(
      { ok: false, failureCode: "invalid_artist_id", detail: "Invalid artist id in URL." },
      { status: 400 },
    );
  }

  return handleArtistProfilePatchRequest({
    request,
    database: env.DB,
    actor,
    targetArtistIdOverride: targetArtistId,
  });
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

export default function AdminArtistEditPage({
  loaderData,
}: Route.ComponentProps) {
  const { artistProfile, isJustCreated, targetArtistId } = loaderData;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.heading}>
          Editing {artistProfile.displayName}
        </h1>
        <p className={styles.subheading}>
          Admin editor. Changes apply to this artist's public profile.
        </p>
      </header>

      {isJustCreated && (
        <div role="status" className={styles.reminderBanner}>
          <p className={styles.reminderHeading}>Next step: Cloudflare Access</p>
          <p className={styles.reminderBody}>
            Add <strong>{artistProfile.email}</strong> to the Access policy for
            this app. Without it, the artist can't log in — no matter what's
            filled in below.
          </p>
        </div>
      )}

      <nav aria-label="Artist photo sections" className={styles.sectionNav}>
        <Link to={`/admin/artists/${targetArtistId}/photos`} className={styles.sectionLink}>
          Photos
        </Link>
        {artistProfile.role !== "piercing" && (
          <Link to={`/admin/artists/${targetArtistId}/flash`} className={styles.sectionLink}>
            Flash
          </Link>
        )}
      </nav>

      <ArtistProfileForm
        artistProfile={artistProfile}
        actorKind="admin"
        targetArtistIdForAdmin={targetArtistId}
      />

      <DeleteArtistPanel
        targetArtistId={targetArtistId}
        displayName={artistProfile.displayName}
      />
    </main>
  );
}