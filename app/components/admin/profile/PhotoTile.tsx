import { useEffect, useState } from "react";
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";
import { SortableGridItem } from "~/components/admin/sortable/SortableGrid";
import { ARTIST_STYLES } from "~/lib/artists/artistStyles";
import styles from "./PhotoTile.module.css";

/*
 * One photo cell in the grid. Wraps the image in a SortableGridItem (dnd-kit
 * wiring) and overlays a delete button that flips to "Confirm?" on first
 * click.
 *
 * Delete confirmation is inline rather than a modal or native confirm(). A
 * two-step tap pattern is mobile-friendly, doesn't interrupt the page, and
 * auto-cancels after 3 seconds — misclicks recover on their own without user
 * action.
 *
 * The tile's outer surface is the drag handle (whole cell draggable). The
 * delete button lives inside a container with `pointer-events` isolation so
 * clicks on it don't propagate up to the drag listeners. The SortableGrid
 * component's PointerSensor also has an 8px distance threshold, which
 * further defends against click-becomes-drag confusion.
 */

/*
 * How long the "confirm?" state stays visible before reverting to the
 * default delete affordance.
 */
const CONFIRM_TIMEOUT_MS = 3000;

type PhotoTileProps = {
  photo: {
    id: number;
    objectKey: string;
    width: number;
    height: number;
    style: string | null;
  };
  onDelete: (photoId: number) => void;
  isDeleting: boolean;
  onStyleChange: (photoId: number, nextStyle: string | null) => void;
  isUpdatingStyle: boolean;
};

const PHOTO_TILE_SIZES = "(max-width: 60rem) 33vw, 200px";

export default function PhotoTile(props: PhotoTileProps) {
  const { photo, onDelete, isDeleting, onStyleChange, isUpdatingStyle } = props;

  const [isConfirming, setIsConfirming] = useState(false);

  // Auto-revert the confirm state after the timeout. The cleanup handles the
  // case where the tile unmounts or the user confirms before the timer fires.
  useEffect(() => {
    if (!isConfirming) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsConfirming(false);
    }, CONFIRM_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isConfirming]);

  function handleDeleteButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Stop the event before it reaches SortableGridItem's drag listeners.
    // Without this, a click on the button can register as the start of a
    // drag if the pointer moves at all before mouseup.
    event.stopPropagation();

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsConfirming(false);
    onDelete(photo.id);
  }

  function handleDeleteButtonKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    // Space and Enter on the button should trigger click behavior only; the
    // SortableGrid's keyboard sensor uses Space as the pick-up gesture, so
    // without this the same key press starts a drag AND triggers the button.
    event.stopPropagation();
  }

  function handleStyleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextStyle = event.target.value === "" ? null : event.target.value;
    onStyleChange(photo.id, nextStyle);
  }

  function handleStyleSelectClick(event: React.MouseEvent<HTMLSelectElement>) {
    // Same isolation as the delete button — stop the click before it reaches
    // SortableGridItem's drag listeners.
    event.stopPropagation();
  }

  function handleStyleSelectKeyDown(
    event: React.KeyboardEvent<HTMLSelectElement>,
  ) {
    event.stopPropagation();
  }

  const photoImageAttributes = buildPortfolioImageAttributes({
    objectKey: photo.objectKey,
    sizes: PHOTO_TILE_SIZES,
  });

  return (
    <SortableGridItem itemId={photo.id}>
      <div className={styles.tile} data-deleting={isDeleting}>
        <img
          src={photoImageAttributes.src}
          srcSet={photoImageAttributes.srcSet}
          sizes={photoImageAttributes.sizes}
          width={photo.width}
          height={photo.height}
          alt=""
          loading="lazy"
          className={styles.photo}
          draggable={false}
        />
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleDeleteButtonClick}
            onKeyDown={handleDeleteButtonKeyDown}
            disabled={isDeleting}
            data-confirming={isConfirming}
            aria-label={
              isConfirming
                ? "Confirm delete photo"
                : "Delete photo"
            }
            className={styles.deleteButton}
          >
            {isDeleting ? "…" : isConfirming ? "Confirm?" : "×"}
          </button>
        </div>
        <select
          value={photo.style ?? ""}
          onChange={handleStyleSelectChange}
          onClick={handleStyleSelectClick}
          onKeyDown={handleStyleSelectKeyDown}
          disabled={isUpdatingStyle}
          aria-label="Photo style"
          className={styles.styleBadge}
        >
          <option value="">Unsorted</option>
          {ARTIST_STYLES.map((styleOption) => (
            <option key={styleOption} value={styleOption}>
              {styleOption}
            </option>
          ))}
        </select>
      </div>
    </SortableGridItem>
  );
}