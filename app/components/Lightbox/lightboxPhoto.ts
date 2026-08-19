export interface LightboxPhoto {
  id: number | string;
  objectKey: string;
  width: number;
  height: number;
  alt?: string;
  artist?: LightboxArtistLink;
}

export interface LightboxArtistLink {
  slug: string;
  displayName: string;
}

export interface LightboxLabels {
  close: string;
  previous: string;
  next: string;
  bookNow: string;
  visitArtistPrefix: string;
}