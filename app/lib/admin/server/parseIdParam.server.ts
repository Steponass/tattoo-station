/**
 * Parses a route's `:id` param into a positive integer artist id, or `null`
 * if it's missing or malformed. Shared by every /admin/artists/:id route.
 */
export function parsePositiveIntParam(rawParam: string | undefined): number | null {
  if (rawParam === undefined) {
    return null;
  }

  const parsed = Number(rawParam);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
