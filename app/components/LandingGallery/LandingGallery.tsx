// app/components/LandingGallery/LandingGallery.tsx

import { useMemo, useRef } from "react";
import { Lightbox, LightboxTrigger } from "~/components/Lightbox/Lightbox";
import type {
  LightboxLabels,
  LightboxPhoto,
} from "~/components/Lightbox/lightboxPhoto";
import { buildPortfolioImageBackgroundUrl } from "~/lib/media/portfolioImageAttributes";
import { useHorizontalDragScroll } from "./useHorizontalDragScroll";
import styles from "./LandingGallery.module.css";


export type LandingGalleryPhoto = {
  photoId: number;
  objectKey: string;
  width: number;
  height: number;
  artistSlug: string;
  artistDisplayName: string;
};

type LandingGalleryProps = {
  photos: readonly LandingGalleryPhoto[];
  labels: LightboxLabels;
};

export default function LandingGallery(props: LandingGalleryProps) {
  const { photos = [], labels } = props;

  const lightboxPhotos = useMemo<readonly LightboxPhoto[]>(
    () => photos.map(toLightboxPhoto),
    [photos],
  );
  
  const landingGalleryContainerRef = useRef<HTMLDivElement>(null);

  const { topRowPhotos, bottomRowPhotos } = splitPhotosIntoRows(photos);

  const topRowDrag = useHorizontalDragScroll();
  const bottomRowDrag = useHorizontalDragScroll();

  if (photos.length === 0) {
    return null;
  }

  return (
    <section>
      <Lightbox photos={lightboxPhotos} labels={labels}>
        <div
          className={styles.landing_gallery_container}
          ref={landingGalleryContainerRef}
        >
          <div className={styles.landing_gallery_top} {...topRowDrag}>
            {topRowPhotos.map((photo) => (
              <LandingGalleryTile key={photo.photoId} photo={photo} />
            ))}
          </div>
          <div className={styles.landing_gallery_bottom} {...bottomRowDrag}>
            {bottomRowPhotos.map((photo) => (
              <LandingGalleryTile key={photo.photoId} photo={photo} />
            ))}
          </div>
        </div>
      </Lightbox>
    </section>
  );
}

function toLightboxPhoto(photo: LandingGalleryPhoto): LightboxPhoto {
  return {
    id: photo.photoId,
    objectKey: photo.objectKey,
    width: photo.width,
    height: photo.height,
    alt: `Work by ${photo.artistDisplayName}`,
    artist: {
      slug: photo.artistSlug,
      displayName: photo.artistDisplayName,
    },
  };
}

type LandingGalleryTileProps = {
  photo: LandingGalleryPhoto;
};

function LandingGalleryTile(props: LandingGalleryTileProps) {
  const { photo } = props;

  const backgroundImageUrl = buildPortfolioImageBackgroundUrl({
    objectKey: photo.objectKey,
  });

  return (
    <LightboxTrigger
      photoId={photo.photoId}
      className={`${styles.landing_gallery_tile} gallery-image-wrapper`}
      ariaLabel={`Work by ${photo.artistDisplayName}`}
    >
      {/* No <img> here on purpose — iOS Safari offers its native
          long-press "lift this photo" drag/share gesture on <img>
          elements no matter what draggable/-webkit-* properties are
          set, so the tile is painted as a background-image instead. */}
      <span
        aria-hidden="true"
        className={styles.landing_gallery_tile_image}
        style={{ backgroundImage: `url("${backgroundImageUrl}")` }}
      />
    </LightboxTrigger>
  );
}

/**
 * Splits the placement list into halves. Even counts split evenly; odd
 * counts put the extra photo in the top row (arbitrary but stable).
 * The split is on placement order, not by artist or category — the
 * curator's chosen sequence is what determines which row a photo lands
 * on.
 */
function splitPhotosIntoRows(photos: readonly LandingGalleryPhoto[]): {
  topRowPhotos: LandingGalleryPhoto[];
  bottomRowPhotos: LandingGalleryPhoto[];
} {
  const midpoint = Math.ceil(photos.length / 2);
  return {
    topRowPhotos: photos.slice(0, midpoint),
    bottomRowPhotos: photos.slice(midpoint),
  };
}