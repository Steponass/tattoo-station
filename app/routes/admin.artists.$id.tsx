import { data, Link } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { adminActorContext } from "~/lib/admin/server/adminActorContext.server";
import { requireAdmin } from "~/lib/admin/server/routeGuards.server";
import { reject } from "~/lib/admin/server/actionResponses.server";
import { parsePositiveIntParam } from "~/lib/admin/server/parseIdParam.server";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import { handleArtistProfilePatchRequest } from "~/lib/artists/artistProfilePatch.server";
import ArtistProfileForm from "~/components/admin/profile/ArtistProfileForm";
import type { Route } from "./+types/admin.artists.$id";
import DeleteArtistPanel from "~/components/admin/profile/DeleteArtistPanel";
import styles from "./admin.artists.$id.module.css";

/*
 * The admin's editor for any single artist. Same form as /admin/me, but with
 * `actorKind="admin"` — the four admin-only Identity fields (slug, role,
 * email, displayName) become editable.
 *
 */
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  requireAdmin(context.get(adminActorContext), "/admin/me");

  const targetArtistId = parsePositiveIntParam(params.id);

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
  const actor = context.get(adminActorContext);

  if (actor.kind === "artist") {
    return reject(
      "wrong_route",
      "Artists edit their own profile at /admin/me.",
      403,
    );
  }

  const targetArtistId = parsePositiveIntParam(params.id);

  if (targetArtistId === null) {
    return reject("invalid_artist_id", "Invalid artist id in URL.", 400);
  }

  return handleArtistProfilePatchRequest({
    request,
    database: env.DB,
    actor,
    targetArtistIdOverride: targetArtistId,
  });
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