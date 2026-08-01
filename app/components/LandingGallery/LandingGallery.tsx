// app/components/LandingGallery/LandingGallery.tsx

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Lightbox, LightboxTrigger } from "~/components/Lightbox/Lightbox";
import type {
  LightboxLabels,
  LightboxPhoto,
} from "~/components/Lightbox/lightboxPhoto";
import { buildPortfolioImageUrl } from "~/lib/media/portfolioImageUrl";
import styles from "./LandingGallery.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * The home-page hero gallery. Two rows of curated photos, pinned during
 * scroll, translated in opposite directions on scrub. Photos come from D1
 * via gallery_placements (gallery='landing'), curated by the admin at
 * /admin/landing.
 *
 * The parallax is data-adaptive. The parent's placement list is split into
 * halves — first half top row, second half bottom row — and each row's
 * translation is computed from its actual measured width at animation
 * setup time. That means the effect works with any number of placed
 * photos, though at low counts (row narrower than the viewport) the row
 * skips its animation entirely and renders static, since there's nothing
 * to reveal by translating.
 *
 * Renders null when no photos are placed. The landing gallery is one of
 * several hero sections on the home page; an empty version reads as broken.
 * Hiding leaves the page's other sections intact.
 *
 * Reduced-motion respect via gsap.matchMedia: users with the preference
 * see the photos as a static two-row layout with no scroll-driven
 * animation and no ScrollTrigger pin.
 *
 * Each tile opens a shared <Lightbox> carrying every placed photo, in
 * placement order — not row order — so prev/next walks the whole gallery
 * rather than stopping at the row boundary the parallax split created.
 * The tile used to be a <LocalizedLink> to the artist's page; that
 * navigation now lives on the lightbox's "visit artist" button, since a
 * tile click is an open action rather than a navigation.
 *
 * The <Lightbox> wraps the pinned container rather than sitting inside
 * it: ScrollTrigger's pin applies a transform to that element, and a
 * transformed ancestor is a containing block for fixed-position
 * descendants. Keeping the dialog outside the pin sidesteps the question
 * entirely.
 */

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
  const landingGalleryTopRef = useRef<HTMLDivElement>(null);
  const landingGalleryBottomRef = useRef<HTMLDivElement>(null);

  const { topRowPhotos, bottomRowPhotos } = splitPhotosIntoRows(photos);

  /**
   * gsap.matchMedia handles the reduced-motion branch. The "no motion"
   * variant simply doesn't register a ScrollTrigger, so no pin and no
   * scrub — the rows sit statically wherever CSS puts them. GSAP's
   * matchMedia is a scoped API for setting up animations conditionally,
   * unrelated to (but internally using) the DOM matchMedia the project
   * bans for responsive-behavior JS.
   *
   * The dependency array includes `photos` because a curator adding or
   * removing photos changes row widths, and the animation must resample
   * on re-render. useGSAP tears down and recreates the context on each
   * dependency change.
   */
  useGSAP(
    () => {
      const matchMedia = gsap.matchMedia();

      matchMedia.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const landingGalleryContainer = landingGalleryContainerRef.current;
          const landingGalleryTop = landingGalleryTopRef.current;
          const landingGalleryBottom = landingGalleryBottomRef.current;

          if (
            landingGalleryContainer === null ||
            landingGalleryTop === null ||
            landingGalleryBottom === null
          ) {
            return;
          }

          const containerWidth = landingGalleryContainer.clientWidth;
          const topRowWidth = landingGalleryTop.scrollWidth;
          const bottomRowWidth = landingGalleryBottom.scrollWidth;

          const topRowShift = Math.max(topRowWidth - containerWidth, 0);
          const bottomRowShift = Math.max(bottomRowWidth - containerWidth, 0);

          // If neither row overflows the container there's nothing to
          // reveal by translating. Skip the ScrollTrigger entirely —
          // pinning to run an empty animation is worse UX than not
          // pinning at all.
          if (topRowShift === 0 && bottomRowShift === 0) {
            return;
          }

          // Bottom row starts offset to the left by its full shift so it
          // has room to move rightward across the scrub. Top row starts
          // at rest and moves leftward. The visual is "top goes left,
          // bottom goes right, in sequence."
          gsap.set(landingGalleryBottom, { x: -bottomRowShift });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: landingGalleryContainer,
              start: "10px 15%",
              end: "+=100%",
              scrub: 1,
              pin: true,
            },
          });

          if (topRowShift > 0) {
            timeline.to(landingGalleryTop, { x: -topRowShift });
          }

          if (bottomRowShift > 0) {
            timeline.to(landingGalleryBottom, { x: 0 });
          }
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    { dependencies: [photos], scope: landingGalleryContainerRef },
  );

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
          <div className={styles.landing_gallery_top} ref={landingGalleryTopRef}>
            {topRowPhotos.map((photo) => (
              <LandingGalleryTile key={photo.photoId} photo={photo} />
            ))}
          </div>
          <div
            className={styles.landing_gallery_bottom}
            ref={landingGalleryBottomRef}
          >
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
    src: buildPortfolioImageUrl(photo.objectKey),
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

  return (
    <LightboxTrigger
      photoId={photo.photoId}
      className={styles.landing_gallery_tile}
    >
      <div className={styles.placeholder}>
        <img
          src={buildPortfolioImageUrl(photo.objectKey)}
          alt={`Work by ${photo.artistDisplayName}`}
          width={photo.width}
          height={photo.height}
          loading="lazy"
        />
      </div>
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