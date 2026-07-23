const DEFAULT_EXCERPT_MAX_LENGTH = 150;
const ELLIPSIS = "…";

/**
 * Derives a short excerpt from a full bio, truncating on a word
 * boundary. Used only when no hand-written excerpt exists.
 */
export function buildBioExcerpt(
  fullBio: string,
  maxLength: number = DEFAULT_EXCERPT_MAX_LENGTH,
): string {
  const normalizedBio = fullBio.trim().replace(/\s+/g, " ");

  if (normalizedBio.length <= maxLength) {
    return normalizedBio;
  }

  const hardTruncated = normalizedBio.slice(0, maxLength);
  const lastSpaceIndex = hardTruncated.lastIndexOf(" ");

  if (lastSpaceIndex === -1) {
    return hardTruncated + ELLIPSIS;
  }

  return hardTruncated.slice(0, lastSpaceIndex).trimEnd() + ELLIPSIS;
}