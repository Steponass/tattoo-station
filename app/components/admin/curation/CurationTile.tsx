// app/components/admin/curation/CurationTile.tsx

import { useEffect, useState } from "react";
import { buildPortfolioImageUrl } from "~/lib/media/portfolioImageUrl";
import { SortableGridItem } from "~/components/admin/sortable/SortableGrid";
import styles from "./CurationTile.module.css";

/**
 * Curation tiles come in three visual variants, each represented by its own
 * component with its own interaction shape. They share the image + artist
 * label markup but diverge on affordance:
 *
 *   PlacedCurationTile   — draggable (via SortableGridItem), remove button
 *   PlaceableCurationTile — plain, whole tile is add-affordance
 *   BlockedCurationTile   — plain, dimmed, hint says "in other gallery"
 *
 * Kept as three components rather than one prop-driven component because
 * the interaction shapes differ enough that a single variant-switching
 * component would collapse into per-variant branches everywhere. Three
 * focused components read cleaner than one that says "if placed, wrap in
 * SortableGridItem; if blocked, disable clicks; if placeable, whole thing
 * is clickable."
 */

/** Two-step confirm timeout, matching PhotoTile from Step 2. */
const CONFIRM_TIMEOUT_MS = 3000;

// ---------------------------------------------------------------------------
// Shared shape
// ---------------------------------------------------------------------------

export type CurationTilePhoto = {
  photoId: number;
  objectKey: string;
  width: number;
  height: number;
  artistDisplayName: string;
};

// ---------------------------------------------------------------------------
// PlacedCurationTile
// ---------------------------------------------------------------------------

type PlacedCurationTileProps = {
  photo: CurationTilePhoto;
  onRemove: (photoId: number) => void;
  isRemoving: boolean;
};

export function PlacedCurationTile(props: PlacedCurationTileProps) {
  const { photo, onRemove, isRemoving } = props;

  const [isConfirming, setIsConfirming] = useState(false);

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

  function handleRemoveClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsConfirming(false);
    onRemove(photo.photoId);
  }

  function handleRemoveKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
  }

  return (
    <SortableGridItem itemId={photo.photoId}>
      <div className={styles.tile} data-mutating={isRemoving}>
        <img
          src={buildPortfolioImageUrl(photo.objectKey)}
          width={photo.width}
          height={photo.height}
          alt=""
          loading="lazy"
          className={styles.image}
          draggable={false}
        />
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleRemoveClick}
            onKeyDown={handleRemoveKeyDown}
            disabled={isRemoving}
            data-confirming={isConfirming}
            aria-label={isConfirming ? "Confirm remove" : "Remove from gallery"}
            className={styles.removeButton}
          >
            {isRemoving ? "…" : isConfirming ? "Confirm?" : "×"}
          </button>
        </div>
        <p className={styles.artistLabel}>{photo.artistDisplayName}</p>
      </div>
    </SortableGridItem>
  );
}

// ---------------------------------------------------------------------------
// PlaceableCurationTile
// ---------------------------------------------------------------------------

type PlaceableCurationTileProps = {
  photo: CurationTilePhoto;
  onAdd: (photoId: number) => void;
  isAdding: boolean;
};

export function PlaceableCurationTile(props: PlaceableCurationTileProps) {
  const { photo, onAdd, isAdding } = props;

  function handleAddClick() {
    if (!isAdding) {
      onAdd(photo.photoId);
    }
  }

  return (
    <li className={styles.tileListItem}>
      <button
        type="button"
        onClick={handleAddClick}
        disabled={isAdding}
        aria-label={`Add photo by ${photo.artistDisplayName} to gallery`}
        className={styles.placeableButton}
      >
        <div className={styles.tile} data-mutating={isAdding}>
          <img
            src={buildPortfolioImageUrl(photo.objectKey)}
            width={photo.width}
            height={photo.height}
            alt=""
            loading="lazy"
            className={styles.image}
            draggable={false}
          />
          {isAdding && (
            <div className={styles.addingOverlay} aria-hidden="true">
              Adding…
            </div>
          )}
          <p className={styles.artistLabel}>{photo.artistDisplayName}</p>
        </div>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// BlockedCurationTile
// ---------------------------------------------------------------------------

type BlockedCurationTileProps = {
  photo: CurationTilePhoto;
  blockedHint: string;
};

export function BlockedCurationTile(props: BlockedCurationTileProps) {
  const { photo, blockedHint } = props;

  return (
    <li className={styles.tileListItem}>
      <div
        className={styles.tile}
        data-blocked="true"
        title={blockedHint}
        aria-label={`${photo.artistDisplayName}: ${blockedHint}`}
      >
        <img
          src={buildPortfolioImageUrl(photo.objectKey)}
          width={photo.width}
          height={photo.height}
          alt=""
          loading="lazy"
          className={styles.image}
          draggable={false}
        />
        <div className={styles.blockedOverlay} aria-hidden="true">
          {blockedHint}
        </div>
        <p className={styles.artistLabel}>{photo.artistDisplayName}</p>
      </div>
    </li>
  );
}