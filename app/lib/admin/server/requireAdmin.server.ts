// app/lib/admin/server/requireAdmin.server.ts

import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

/**
 * The identity of the authenticated admin, resolved from a verified Access JWT.
 * `email` is the person Cloudflare Access authenticated; use it for "who did this"
 * logging on writes.
 */
export type AdminIdentity = {
  email: string;
};

export type RequireAdminOutcome =
  | { ok: true; identity: AdminIdentity }
  | { ok: false; status: 403; failureCode: AdminAuthFailureCode };

/**
 * Error codes rather than messages, so the caller decides on wording (and so we
 * never leak verification internals to the client).
 */
export type AdminAuthFailureCode =
  | "missing_audience_config"
  | "missing_access_token"
  | "invalid_access_token";

type AdminAuthEnv = {
  POLICY_AUD: string;
  TEAM_DOMAIN: string;
};

/**
 * Cloudflare Access injects the token on the request header (preferred over the
 * CF_Authorization cookie, which is not guaranteed to be sent).
 */
const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

/**
 * In local development there is no Access layer in front of `wrangler dev`, so no
 * token exists. This stubbed identity keeps the dev loop working without weakening
 * the production path — the whole branch is compiled out of the production build,
 * because Vite statically replaces `import.meta.env.DEV` with `false` there.
 */
const DEV_ADMIN_IDENTITY: AdminIdentity = {
  email: "dev@localhost",
};

/**
 * Built once at module scope, not per request. `createRemoteJWKSet` caches the
 * fetched keys and only re-fetches when it sees an unknown `kid` — which is how it
 * absorbs Access's 6-weekly key rotation without us hard-coding a public key.
 * Rebuilding it inside the handler would throw that cache away on every upload.
 */
let cachedRemoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getRemoteJwks(teamDomain: string) {
  if (cachedRemoteJwks === null) {
    const certificatesUrl = new URL(`${teamDomain}/cdn-cgi/access/certs`);
    cachedRemoteJwks = createRemoteJWKSet(certificatesUrl);
  }

  return cachedRemoteJwks;
}

function extractEmail(payload: JWTPayload): string {
  const email = payload.email;
  return typeof email === "string" && email.length > 0
    ? email
    : "authenticated user";
}

/**
 * Gate for admin-only write endpoints. In production it verifies the Cloudflare
 * Access JWT (signature, issuer, audience) and resolves the caller's email. In dev
 * it returns a stub so the endpoint stays reachable behind `wrangler dev`.
 *
 * The endpoint calls this once and reads `outcome.identity`; it never touches the
 * header or `jose` directly.
 */
export async function requireAdmin(
  request: Request,
  env: AdminAuthEnv,
): Promise<RequireAdminOutcome> {
  if (import.meta.env.DEV) {
    return { ok: true, identity: DEV_ADMIN_IDENTITY };
  }

  if (!env.POLICY_AUD || !env.TEAM_DOMAIN) {
    return { ok: false, status: 403, failureCode: "missing_audience_config" };
  }

  const accessToken = request.headers.get(ACCESS_JWT_HEADER);

  if (!accessToken) {
    return { ok: false, status: 403, failureCode: "missing_access_token" };
  }

  try {
    const remoteJwks = getRemoteJwks(env.TEAM_DOMAIN);

    const { payload } = await jwtVerify(accessToken, remoteJwks, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    });

    return { ok: true, identity: { email: extractEmail(payload) } };
  } catch {
    return { ok: false, status: 403, failureCode: "invalid_access_token" };
  }
}