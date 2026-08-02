/**
 * The shapes the roster components render. Built by the /artists loader from
 * D1 rows — the loader resolves the request's locale, so the text here is
 * already in one language rather than a per-locale record.
 */

export interface RosterPreviewPhoto {
  id: number;
  url: string;
  width: number;
  height: number;
}

/** No id: an avatar is one image on its artist, not a row the UI keys on. */
export interface RosterAvatar {
  url: string;
  width: number;
  height: number;
}

export interface RosterArtist {
  id: number;
  slug: string;
  name: string;
  /** Determines where the roster item's "see more" button points — every
   *  role but "piercing" links to the artist's own profile page; a piercing
   *  artist's real page is /piercing, which she owns. */
  role: "tattoo" | "piercing" | "both";
  styles: string[];
  bioExcerpt: string;
  /** Null until the artist uploads one — the summary renders without it. */
  avatar: RosterAvatar | null;
  previewPhotos: RosterPreviewPhoto[];
}

export interface RosterCopy {
  viewFullProfileLabel: string;
  stylesSeparator: string;
}
