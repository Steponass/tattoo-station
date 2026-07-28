import { getTranslation, type LocalesValues } from "intlayer";
import type { LocalizedContent } from "./roster.types";

const ROSTER_POSITION_PAD_LENGTH = 2;
const BIO_EXCERPT_MAX_LENGTH = 70;
const ELLIPSIS = "…";

export function resolveLocalizedContent(
  content: LocalizedContent,
  locale: LocalesValues,
): string {
  return getTranslation(content, locale);
}

export function formatRosterPosition(zeroBasedIndex: number): string {
  return String(zeroBasedIndex + 1).padStart(ROSTER_POSITION_PAD_LENGTH, "0");
}

export function splitRosterPositionDigits(position: string): string[] {
  return position.split("");
}

export function buildBioExcerpt(
  bio: string,
  maxLength: number = BIO_EXCERPT_MAX_LENGTH,
): string {
  if (bio.length <= maxLength) {
    return bio;
  }

  const hardTruncated = bio.slice(0, maxLength);
  const lastSpaceIndex = hardTruncated.lastIndexOf(" ");
  const safeEndIndex = lastSpaceIndex > 0 ? lastSpaceIndex : maxLength;

  return `${hardTruncated.slice(0, safeEndIndex).trimEnd()}${ELLIPSIS}`;
}

export function buildArtistProfilePath(locale: string, slug: string): string {
  return `/${locale}/artists/${slug}`;
}