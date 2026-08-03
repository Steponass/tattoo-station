import type { RosterPreviewPhoto } from "~/data/roster.types";
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";
import styles from "./Roster.module.css";

/**
 * The preview grid lays out six columns above the 800px breakpoint and two
 * columns below. On a wide viewport each tile is roughly the container's
 * inner width divided by six — about 240 CSS pixels on a 1440px container.
 * On narrow viewports each tile is roughly half the viewport.
 *
 * Rounding to viewport fractions: 16vw above the breakpoint, 50vw below.
 * At 2× DPR the picker lands on the 800w ladder variant on desktop and the
 * 400w variant on mobile — the smallest rung that fully covers the display
 * slot at that pixel density.
 */
const PREVIEW_TILE_SIZES = "(max-width: 800px) 50vw, 16vw";

interface RosterPreviewGridProps {
  photos: RosterPreviewPhoto[];
}

export function RosterPreviewGrid({ photos }: RosterPreviewGridProps) {
  // An artist with no photos yet gets no empty grid — the panel's gap would
  // otherwise open a gap around nothing.
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className={styles.preview_grid_wrapper}>
      <ul className={styles.preview_grid}>
        {photos.map((photo) => (
          <PreviewTile key={photo.id} photo={photo} />
        ))}
      </ul>
    </div>
  );
}

interface PreviewTileProps {
  photo: RosterPreviewPhoto;
}

function PreviewTile({ photo }: PreviewTileProps) {
  const { src, srcSet, sizes } = buildPortfolioImageAttributes({
    objectKey: photo.objectKey,
    sizes: PREVIEW_TILE_SIZES,
  });

  return (
    <li className={styles.preview_item}>
      {/* Decorative: the teaser repeats work the profile page presents in
          full, and D1 stores no alt text for portfolio photos. */}
      <img
        className={styles.preview_image}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt=""
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
      />
    </li>
  );
}