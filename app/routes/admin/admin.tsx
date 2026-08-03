// app/routes/admin.tsx

import { data, Outlet } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import type { Route } from "../+types/admin";
import Testimonials from "~/components/Testimonials/Testimonials";

/**
 * The single authentication gate for every route under /admin. Runs on the
 * server for the initial navigation and on any client-side navigation into or
 * within /admin. Any request that resolves to `unknown` is stopped here with a
 * 403 — no admin child route, and no admin API endpoint reached through the
 * app UI, ever renders for an unrecognized caller.
 *
 * The resolved actor is passed down through loader data. Child routes read
 * `useRouteLoaderData("routes/admin")` — or the same via typed `useMatches` —
 * and never call `resolveActor` themselves. Endpoints (which are hit directly
 * by fetch, not through this layout) do call `resolveActor` themselves; that
 * is intentional and documented in the resolver itself.
 *
 * This route deliberately renders no chrome yet: no nav, no header, nothing
 * but the outlet. Step 2 of the build (the artist dashboard) will introduce
 * shared admin chrome; putting it here before there are pages to hang it off
 * would be premature.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    // `data()` with a status throws through the response, which React Router
    // surfaces via the route ErrorBoundary. Kept as a bare 403 for now; the
    // Access-gated subdomain sits in front, so a human reaching this state is
    // either a misconfigured Access policy or a stale login — both are the
    // operator's problem, not the visitor's, and a wordy explanation would
    // leak more than it helps.
    throw data("Forbidden", { status: 403 });
  }

  return { actor };
}

export default function AdminLayout() {
  return(
  <>
  <Outlet />
  </>
  );
}