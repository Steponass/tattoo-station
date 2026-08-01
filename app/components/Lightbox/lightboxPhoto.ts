// app/components/Lightbox/lightboxPhoto.ts

/**
 * The photo shape the Lightbox understands. Every consumer (LandingGallery,
 * ArtistGallery, FlashTattooGallery, and later piercing / tattoostyles) maps
 * its own domain photo record into this shape before passing it in. Keeping
 * the Lightbox on a single narrow shape means no gallery-specific branches
 * inside the component — the mapping is the gallery's problem, the
 * behaviour is the Lightbox's.
 *
 * `id` is intentionally `number | string` so a numeric D1 photo_id and a
 * hypothetical string key (e.g. a static asset path used on tattoostyles)
 * are both valid without a compat layer.
 *
 * `artist` is optional per photo. LandingGallery and FlashTattooGallery
 * carry it on every photo (each photo may belong to a different artist).
 * ArtistGallery photos omit it — the visitor is already on that artist's
 * page, so the "visit artist" button would be a no-op. Piercing and
 * tattoostyles decide per page whether they have artist context to attach.
 */
export interface LightboxPhoto {
  id: number | string;
  src: string;
  width: number;
  height: number;
  alt?: string;
  artist?: LightboxArtistLink;
}

export interface LightboxArtistLink {
  slug: string;
  displayName: string;
}

/**
 * Localised strings the Lightbox needs. Owned by the caller because the
 * component is deliberately i18n-agnostic — Intlayer, hardcoded English,
 * anything with the right shape works. The caller reads their locale
 * dictionary once and passes the strings; the Lightbox never imports
 * `useIntlayer`.
 */
export interface LightboxLabels {
  /** aria-label on the close button ("Close", "Uždaryti"). */
  close: string;
  /** aria-label on the previous button ("Previous photo"). */
  previous: string;
  /** aria-label on the next button ("Next photo"). */
  next: string;
  /** Visible text on the book-now button ("Book now", "Rezervuoti"). */
  bookNow: string;
  /**
   * Visible text on the artist-link button when the current photo carries an
   * artist. The artist's display name is appended by the component
   * ("Visit ROMAN"). If a caller wants a different composition, they can
   * pass their own template in later — for now this is the whole button
   * text minus the name.
   */
  visitArtistPrefix: string;
}