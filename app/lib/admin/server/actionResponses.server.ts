// app/lib/admin/server/actionResponses.server.ts

/**
 * The standard failure envelope every /admin action and admin.api.* endpoint
 * returns: `{ ok: false, failureCode, detail }` at the given status. Actions
 * `return` this (never `throw` it) so the payload reaches `fetcher.data`
 * instead of the route's ErrorBoundary.
 */
export function reject(
  failureCode: string,
  detail: string,
  status: number,
): Response {
  return Response.json({ ok: false, failureCode, detail }, { status });
}
