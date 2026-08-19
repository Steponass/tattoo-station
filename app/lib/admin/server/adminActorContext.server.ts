import { createContext } from "react-router";
import type { ResolvedActor } from "./resolveActor.server";

/**
 * Carries the actor resolved once by the /admin layout's middleware (see
 * admin.tsx) to every loader and action nested under /admin — including the
 * admin.api.* endpoints, since they're nested under the same layout route and
 * so run the same middleware even when hit directly rather than through a
 * page navigation.
 *
 * Only ever holds a non-"unknown" actor: the middleware throws a 403 before
 * setting this context otherwise, so no descendant handler runs without it.
 * Reading this context is a plain `context.get(adminActorContext)` — no
 * default value is provided, so reading it outside the /admin subtree (where
 * the middleware never ran) throws, which is the correct failure mode rather
 * than silently treating the caller as unauthenticated.
 */
export const adminActorContext = createContext<ResolvedActor>();
