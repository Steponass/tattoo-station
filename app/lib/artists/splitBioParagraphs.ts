/**
 * Splits a bio into paragraphs on author-inserted blank lines. A bio with
 * no blank line (the common case today) comes back as a single paragraph,
 * unchanged from current rendering.
 */
export function splitBioParagraphs(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
