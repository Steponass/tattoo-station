import { data } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { adminActorContext } from "~/lib/admin/server/adminActorContext.server";
import { requireArtist } from "~/lib/admin/server/routeGuards.server";
import { reject } from "~/lib/admin/server/actionResponses.server";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import { handleArtistProfilePatchRequest } from "~/lib/artists/artistProfilePatch.server";
import ArtistProfileForm from "~/components/admin/profile/ArtistProfileForm";

import type { Route } from "./+types/admin.me";
import NavButton from "~/components/Button/NavButton";
import styles from './admin.me.module.css'

/*
 * The artist's self-service editor.
 *
 * Admins hitting /admin/me are redirected to /admin, which is where admin work
 * happens. This keeps /admin/me a single-purpose route (artist self-service)
 * rather than one that renders different UIs depending on who's looking. Admins
 * who need to edit a specific artist go through /admin/artists/:id (step 4).
 */
export async function loader({ context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = requireArtist(context.get(adminActorContext), "/admin");

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
  const actor = context.get(adminActorContext);

  if (actor.kind === "admin") {
    return reject(
      "wrong_route",
      "Admins edit artists via /admin/artists/:id, not /admin/me.",
      400,
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
      <ArtistProfileForm artistProfile={artistProfile} actorKind="artist"/>
    </main>
  );
}