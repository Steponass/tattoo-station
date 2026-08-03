/**
 * The shapes the roster components render. Built by the /artists loader from
 * D1 rows — the loader resolves the request's locale, so the text here is
 * already in one language rather than a per-locale record.
 *
 * Images are carried as raw R2 object keys, not pre-built URLs. Responsive
 * delivery attributes (src, srcSet, sizes) depend on the CSS layout of the
 * surface rendering them — a component concern, not a loader concern — so
 * the render site calls `buildPortfolioImageAttributes` with a `sizes`
 * value that matches its own layout.
 */

export interface RosterPreviewPhoto {
  id: number;
  objectKey: string;
  width: number;
  height: number;
}

/** No id: an avatar is one image on its artist, not a row the UI keys on. */
export interface RosterAvatar {
  objectKey: string;
  width: number;
  height: number;
}

export interface RosterArtist {
  id: number;
  slug: string;
  name: string;
  styles: string[];
  bioExcerpt: string;
  role: string;
  /** Null until the artist uploads one — the summary renders without it. */
  avatar: RosterAvatar | null;
  previewPhotos: RosterPreviewPhoto[];
}

export interface RosterCopy {
  viewFullProfileLabel: string;
  stylesSeparator: string;
}