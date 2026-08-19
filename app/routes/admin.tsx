import { data, Outlet } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import { adminActorContext } from "~/lib/admin/server/adminActorContext.server";
import type { Route } from "./+types/admin";
import Testimonials from "~/components/Testimonials/Testimonials";

/**
 * The single authentication gate for every route under /admin — and, since
 * admin.api.* endpoints are nested under this same layout route in
 * routes.ts, every direct-fetch admin API request too. Route middleware runs
 * top-down before any loader/action in the matched tree, so this is the only
 * place that calls `resolveActor`: it verifies the Access JWT once per
 * request and stashes the result in `adminActorContext` for every descendant
 * loader and action to read via `context.get(adminActorContext)`. Any
 * request that resolves to `unknown` is stopped here with a 403 — no admin
 * child route ever runs for an unrecognized caller.
 *
 * This route deliberately renders no chrome yet: no nav, no header, nothing
 * but the outlet. Step 2 of the build (the artist dashboard) will introduce
 * shared admin chrome; putting it here before there are pages to hang it off
 * would be premature.
 */
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }) => {
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

    context.set(adminActorContext, actor);
  },
];

export async function loader({ context }: Route.LoaderArgs) {
  return { actor: context.get(adminActorContext) };
}

export default function AdminLayout() {
  return(
  <>
  <Outlet />
  </>
  );
}