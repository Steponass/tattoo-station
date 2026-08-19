import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import { findArtistAuthByEmail } from "~/lib/artists/artistRepository.server";

/**
 * The resolved caller of an admin-area request. The three variants are the
 * terminal states described in §3 of the handoff: admin (email in the
 * allowlist), artist (email matches a D1 row, active or not), or unknown
 * (nobody recognized).
 *
 * `unknown` deliberately collapses several failure modes — missing Access JWT,
 * invalid JWT, valid JWT with an email in neither list — into one shape. The
 * caller only ever wants to answer "is this a recognized actor?", and every
 * negative answer becomes a 403 at the layout gate. Distinguishing failure
 * modes at the type level would leak verification internals into route code
 * that shouldn't care; distinguishing them for observability happens inside
 * this module via server-side logs.
 */
export type Actor =
  | { kind: "admin"; email: string }
  | { kind: "artist"; artistId: number; email: string }
  | { kind: "unknown" };

/**
 * An `Actor` that has already cleared the `unknown` gate — what every
 * loader/action nested under /admin actually works with, since the admin
 * layout's middleware (see `adminActorContext.server.ts`) throws a 403 before
 * any of them run otherwise.
 */
export type ResolvedActor = Exclude<Actor, { kind: "unknown" }>;

type ResolveActorEnv = {
  POLICY_AUD: string;
  TEAM_DOMAIN: string;
  DEV_ACTOR?: string;
  DB: D1Database;
};

/**
 * Cloudflare Access injects the token on the request header (preferred over
 * the CF_Authorization cookie, which is not guaranteed to be sent on every
 * navigation).
 */
const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";
const DEV_ACTOR_EMAIL = "dev@localhost";

function parseDevActor(rawDevActor: string | undefined): Actor {
  if (typeof rawDevActor !== "string" || rawDevActor.trim() === "") {
    return { kind: "admin", email: DEV_ACTOR_EMAIL };
  }

  const trimmed = rawDevActor.trim();

  if (trimmed === "admin") {
    return { kind: "admin", email: DEV_ACTOR_EMAIL };
  }

  if (trimmed.startsWith("artist:")) {
    const rawId = trimmed.slice("artist:".length);
    const parsedId = Number(rawId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      console.warn(
        `[resolveActor] DEV_ACTOR="${rawDevActor}" — malformed artist id, ` +
          `falling back to admin.`,
      );
      return { kind: "admin", email: DEV_ACTOR_EMAIL };
    }

    return { kind: "artist", artistId: parsedId, email: DEV_ACTOR_EMAIL };
  }

  console.warn(
    `[resolveActor] DEV_ACTOR="${rawDevActor}" — unrecognized value, ` +
      `expected "admin" or "artist:<id>". Falling back to admin.`,
  );
  return { kind: "admin", email: DEV_ACTOR_EMAIL };
}

/**
 * Built once at module scope, not per request. `createRemoteJWKSet` caches the
 * fetched keys and only re-fetches when it sees an unknown `kid`, which is how
 * it absorbs Access's ~6-weekly key rotation without hard-coding a public key.
 * Rebuilding it inside the resolver would throw that cache away on every hit.
 */
let cachedRemoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getRemoteJwks(teamDomain: string) {
  if (cachedRemoteJwks === null) {
    const certificatesUrl = new URL(`${teamDomain}/cdn-cgi/access/certs`);
    cachedRemoteJwks = createRemoteJWKSet(certificatesUrl);
  }

  return cachedRemoteJwks;
}

/**
 * Extracts the email claim from a verified Access JWT payload. A missing or
 * malformed value returns null rather than a placeholder string, so that a
 * misconfigured IdP cannot silently promote "authenticated user" through the
 * resolver into the admin allowlist check.
 */
function extractEmail(payload: JWTPayload): string | null {
  const email = payload.email;

  if (typeof email !== "string" || email.length === 0) {
    return null;
  }

  return email;
}

/**
 * Resolves the caller of an admin-area request to one of three actor kinds.
 * The single source of truth for admin-area authentication.
 *
 * Called by:
 *   - the admin layout loader (once per page navigation), which turns `unknown`
 *     into a 403 and passes the actor down to child routes;
 *   - each admin API endpoint (once per HTTP request), because each endpoint
 *     is fetched directly rather than reached through the layout loader.
 *
 * There is no downstream re-verification: every consumer trusts what this
 * function returns.
 *
 * Resolution order:
 *   1. Verify the Access JWT (signature, issuer, audience).
 *   2. Look up `artists` by email (regardless of is_active).
 *   3. If found and is_admin = 1 → admin.
 *   4. If found and is_admin = 0 → artist.
 *   5. Else → unknown (Access policy and D1 have drifted — logged).
 */
export async function resolveActor(
  request: Request,
  env: ResolveActorEnv,
): Promise<Actor> {
    if (import.meta.env.DEV) {
  return parseDevActor(env.DEV_ACTOR);
}

  if (!env.POLICY_AUD || !env.TEAM_DOMAIN) {
    console.error(
      "[resolveActor] Missing POLICY_AUD or TEAM_DOMAIN — cannot verify Access JWT.",
    );
    return { kind: "unknown" };
  }

  const accessToken = request.headers.get(ACCESS_JWT_HEADER);

  if (accessToken === null) {
    return { kind: "unknown" };
  }

  let verifiedPayload: JWTPayload;

  try {
    const remoteJwks = getRemoteJwks(env.TEAM_DOMAIN);
    const verificationResult = await jwtVerify(accessToken, remoteJwks, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    });

    verifiedPayload = verificationResult.payload;
  } catch (verificationError) {
    console.warn(
      "[resolveActor] Access JWT verification failed:",
      verificationError,
    );
    return { kind: "unknown" };
  }

  const email = extractEmail(verifiedPayload);

  if (email === null) {
    console.warn("[resolveActor] Verified JWT had no usable email claim.");
    return { kind: "unknown" };
  }

  const artistAuth = await findArtistAuthByEmail({
    database: env.DB,
    email,
  });

  if (artistAuth === null) {
    console.warn(
      `[resolveActor] Verified JWT for "${email}" but no artists row exists. ` +
        `Access policy and D1 have drifted — either remove this email from ` +
        `the Access policy or add a matching artists row.`,
    );
    return { kind: "unknown" };
  }

  if (artistAuth.isAdmin) {
    return { kind: "admin", email };
  }

  return { kind: "artist", artistId: artistAuth.id, email };
}