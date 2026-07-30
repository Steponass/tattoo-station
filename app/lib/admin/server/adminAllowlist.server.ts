// app/lib/admin/server/adminAllowlist.server.ts

/**
 * Membership check for the admin email allowlist.
 *
 * The allowlist ships as a Wrangler secret (comma-separated emails), not a D1
 * table, matching the operational spirit of the Cloudflare Access policy: a
 * short, hand-maintained list edited by the operator. Two admins today, maybe
 * three ever — a table would be over-engineering.
 *
 * The check normalizes both sides to lowercase and trimmed. Email local-parts
 * are technically case-sensitive per RFC 5321, but every real-world provider
 * treats them case-insensitively; matching that expectation avoids a class of
 * "why isn't my address recognized" bugs.
 *
 * Empty or missing config fails closed: no one is admin, so every caller falls
 * through to the artist lookup or to `unknown` in the resolver.
 */

/**
 * Splits the raw comma-separated secret into a normalized set of emails. Each
 * entry is lowercased and trimmed; empty entries (from trailing commas or
 * accidental double-commas) are dropped rather than treated as a match for the
 * empty string.
 */
function parseAllowlist(rawAllowlist: string | undefined): Set<string> {
  if (typeof rawAllowlist !== "string" || rawAllowlist.trim() === "") {
    return new Set();
  }

  const normalizedEmails = rawAllowlist
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  return new Set(normalizedEmails);
}

/**
 * True if the given email is in the allowlist. Both sides are normalized to
 * lowercase and trimmed before comparison.
 *
 * The allowlist is re-parsed on every call — the module makes no assumption
 * about how long it should be cached, and with ≤5 entries the parse cost is
 * unmeasurable. A future change to a hot admin path can memoize by identity
 * of `rawAllowlist` if it ever shows up in a profile.
 */
export function isAdminEmail({
  email,
  rawAllowlist,
}: {
  email: string;
  rawAllowlist: string | undefined;
}): boolean {
  const allowedEmails = parseAllowlist(rawAllowlist);

  if (allowedEmails.size === 0) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();

  return allowedEmails.has(normalizedEmail);
}