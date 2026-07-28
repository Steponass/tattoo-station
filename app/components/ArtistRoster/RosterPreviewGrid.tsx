import type { RosterPreviewPhoto } from "~/data/roster.types";
import styles from "./Roster.module.css";

interface RosterPreviewGridProps {
  photos: RosterPreviewPhoto[];
}

export function RosterPreviewGrid({ photos }: RosterPreviewGridProps) {
  return (
    <div className={styles.preview_grid_wrapper}>
    <ul className={styles.preview_grid}>
      {photos.map((photo) => (
        <li key={photo.id} className={styles.preview_item}>
          <img
            className={styles.preview_image}
            src={photo.url}
            alt={photo.alt}
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