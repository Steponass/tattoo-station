import type { LocalesValues } from "intlayer";

export type LocalizedContent = Record<LocalesValues, string>;

export interface RosterPreviewPhoto {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface RosterArtist {
  id: string;
  slug: string;
  name: string;
  styles: string[];
  bio: LocalizedContent;
  bioExcerpt: LocalizedContent;
  avatar: RosterPreviewPhoto;
  previewPhotos: RosterPreviewPhoto[];
}

export interface RosterCopy {
  viewFullProfileLabel: string;
  stylesSeparator: string;
}