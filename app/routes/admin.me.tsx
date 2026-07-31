// app/routes/admin.me.tsx

import { data, redirect } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import { handleArtistProfilePatchRequest } from "~/lib/artists/artistProfilePatch.server";
import ArtistProfileForm from "~/components/admin/profile/ArtistProfileForm";

import type { Route } from "./+types/admin.me";
import NavButton from "~/components/Button/NavButton";
import styles from './admin.me.module.css'

/**
 * The artist's self-service editor. Loads the caller's own profile — never
 * anyone else's — because the loader derives the target artist id from the
 * resolved actor, not from the URL. There is no `:id` segment on this route
 * for that reason: it would create the appearance of an addressable "edit
 * someone else" URL that the loader would then have to reject.
 *
 * Admins hitting /admin/me are redirected to /admin, which is where admin work
 * happens. This keeps /admin/me a single-purpose route (artist self-service)
 * rather than one that renders different UIs depending on who's looking. Admins
 * who need to edit a specific artist go through /admin/artists/:id (step 4).
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    throw data("Forbidden", { status: 403 });
  }

  if (actor.kind === "admin") {
    throw redirect("/admin");
  }

  const artistProfile = await findArtistProfileForEditing({
    database: env.DB,
    artistId: actor.artistId,
  });

  if (artistProfile === null) {
    throw data("Artist not found", { status: 404 });
  }

  return { artistProfile };
}

/**
 * Delegates to the shared profile-patch handler. The route action is
 * intentionally thin — envelope parsing, validation, D1 writes, error mapping
 * all live in the service. This action's only job is auth resolution and the
 * artist-vs-admin gating.
 *
 * Same admin-hitting-artist-route gate as the loader: if an admin's fetcher
 * somehow reaches this action (they shouldn't; the loader redirected them,
 * and the form is rendered only in the artist branch), we 403 rather than
 * fall through to a shared endpoint's admin-patch behavior. The admin edit
 * path lives on its own route with its own action.
 */
export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return Response.json(
      { ok: false, failureCode: "forbidden", detail: "Authentication required." },
      { status: 403 },
    );
  }

  if (actor.kind === "admin") {
    return Response.json(
      {
        ok: false,
        failureCode: "wrong_route",
        detail: "Admins edit artists via /admin/artists/:id, not /admin/me.",
      },
      { status: 400 },
    );
  }

  return handleArtistProfilePatchRequest({
    request,
    database: env.DB,
    actor,
  });
}

export default function AdminMePage({ loaderData }: Route.ComponentProps) {
  const { artistProfile } = loaderData;

  return (
    <main className={styles.admin_main}>
      <h5>Editing your profile</h5>
      <div className={styles.photo_nav_buttons}>
      <NavButton 
        to="/admin/me/photos"
        buttonText="My Photos"
      />
      <NavButton 
        to="/admin/me/flash"
        buttonText="My Flash designs"
      />
</div>
      <ArtistProfileForm artistProfile={artistProfile} />
    </main>
  );
}