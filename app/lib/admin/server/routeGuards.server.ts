import { redirect } from "react-router";
import type { ResolvedActor } from "./resolveActor.server";

/**
 * Narrows a resolved actor to "admin" for loaders that are admin-only,
 * redirecting anyone else. The `unknown` case never reaches here — the
 * admin layout's middleware already gated it before this actor existed.
 */
export function requireAdmin(
  actor: ResolvedActor,
  redirectTo: string,
): Extract<ResolvedActor, { kind: "admin" }> {
  if (actor.kind !== "admin") {
    throw redirect(redirectTo);
  }
  return actor;
}

/**
 * Narrows a resolved actor to "artist" for loaders that are artist-only,
 * redirecting admins elsewhere (typically to the admin-side equivalent page).
 */
export function requireArtist(
  actor: ResolvedActor,
  redirectTo: string,
): Extract<ResolvedActor, { kind: "artist" }> {
  if (actor.kind !== "artist") {
    throw redirect(redirectTo);
  }
  return actor;
}
