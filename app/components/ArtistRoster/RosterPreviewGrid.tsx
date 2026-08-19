import type { RosterPreviewPhoto } from "~/data/roster.types";
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";
import styles from "./Roster.module.css";

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