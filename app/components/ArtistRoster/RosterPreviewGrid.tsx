import type { RosterPreviewPhoto } from "~/data/roster.types";
import styles from "./Roster.module.css";

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
        <li key={photo.id} className={styles.preview_item}>
          {/* Decorative: the teaser repeats work the profile page presents in
              full, and D1 stores no alt text for portfolio photos. */}
          <img
            className={styles.preview_image}
            src={photo.url}
            alt=""
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
          />
        </li>
      ))}
    </ul>
    </div>
  );
}