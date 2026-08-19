export interface RosterPreviewPhoto {
  id: number;
  objectKey: string;
  width: number;
  height: number;
}

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