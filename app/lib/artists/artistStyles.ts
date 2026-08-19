/**
 * The canonical set of tattoo styles used across the site.
 *
 * Single source of truth for two writers: the manually-entered artist `styles`
 * (roster/profile labels) and the per-photo `style` tag. Both are validated
 * against this list at the admin write boundary so the two can never drift —
 * "Blackwork" on a card and "blackwork" on a photo would otherwise be two
 * different strings the gallery could never group together.
 *
 * English-only by decision. Adding a style is a one-line change here; no
 * migration is needed, because D1 stores the value as free text and the
 * integrity check lives in code.
 */
export const ARTIST_STYLES = [
  "Realism",
  "Traditional",
  "Fine line",
  "Watercolor",
  "Black & grey",
  "Abstract",
  "Geometric",
  "Blackwork",
  "Minimalist",
  "Dotwork",
  "Illustrative",
  "New School",
  "Surrealism",
  "Piercing"
] as const;

export type ArtistStyle = (typeof ARTIST_STYLES)[number];

export function isArtistStyle(candidateValue: string): candidateValue is ArtistStyle {
  return (ARTIST_STYLES as readonly string[]).includes(candidateValue);
}