// app/routes/admin.landing.tsx

import { Fragment, useMemo, useState } from "react";
import { data, redirect } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import {
  findArtistFilterOptions,
  findPhotosForCuration,
  type PhotoForCuration,
} from "~/lib/gallery/galleryCurationRepository.server";
import { SortableGrid } from "~/components/admin/sortable/SortableGrid";
import {
  BlockedCurationTile,
  PlaceableCurationTile,
  PlacedCurationTile,
} from "~/components/admin/curation/CurationTile";
import CurationFilters from "~/components/admin/curation/CurationFilters";
import type { PhotoCategoryFilter } from "~/components/admin/curation/photoCategoryFilter";
import type { Route } from "./+types/admin.landing";
import styles from "./admin.landing.module.css";

const CURRENT_GALLERY = "landing" as const;
const OTHER_GALLERY_LABEL = "In flash gallery";

/**
 * Landing-gallery curation. Two-pane split view:
 *
 *   Left  — photos placed in landing, in display order, drag to reorder,
 *           click to remove (two-step confirm).
 *   Right — the pool. Photos placed in the flash gallery appear here dimmed
 *           with a hint; photos not placed anywhere are the actual add-
 *           candidates. Two filters (artist, category) narrow the pool.
 *
 * Admin-only. The route's loader rejects non-admin actors. The endpoint at
 * /api/curate-gallery is the sole write path; this component holds local
 * state, mutations flow through fetch() calls with optimistic UI.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    throw data("Forbidden", { status: 403 });
  }

  if (actor.kind !== "admin") {
    throw redirect("/admin/me");
  }

  const [photos, artistOptions] = await Promise.all([
    findPhotosForCuration({ database: env.DB }),
    findArtistFilterOptions({ database: env.DB }),
  ]);

  return { photos, artistOptions };
}

export default function AdminLandingPage({ loaderData }: Route.ComponentProps) {
  const { photos: initialPhotos, artistOptions } = loaderData;

  const [photos, setPhotos] = useState<PhotoForCuration[]>(() => initialPhotos);
  const [mutatingPhotoIds, setMutatingPhotoIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<PhotoCategoryFilter>("all");

  const { placedPhotos, poolPhotos } = useMemo(
    () => partitionPhotos({ photos, currentGallery: CURRENT_GALLERY }),
    [photos],
  );

  const filteredPoolPhotos = useMemo(
    () =>
      filterPool({
        poolPhotos,
        selectedArtistId,
        selectedCategory,
      }),
    [poolPhotos, selectedArtistId, selectedCategory],
  );

  const placedOrderedIds = placedPhotos.map((photo) => photo.photoId);

  /**
   * LandingGallery.tsx splits placed photos into two rows purely by
   * position — first half (rounded up) on top, the rest on bottom. Mirror
   * that split here so the admin can see which row a drag will land a photo
   * in. Keep this in sync with `splitPhotosIntoRows` in LandingGallery.tsx.
   */
  const topRowCount = Math.ceil(placedPhotos.length / 2);
  const bottomRowCount = placedPhotos.length - topRowCount;

  async function handleReorder(nextOrderedIds: number[]) {
    const previousPhotos = photos;

    setPhotos((currentPhotos) =>
      applyReorderLocally({
        currentPhotos,
        currentGallery: CURRENT_GALLERY,
        nextOrderedIds,
      }),
    );
    setErrorMessage(null);

    const persistResult = await persistCurate({
      kind: "reorder",
      gallery: CURRENT_GALLERY,
      orderedPhotoIds: nextOrderedIds,
    });

    if (!persistResult.ok) {
      setPhotos(previousPhotos);
      setErrorMessage(persistResult.errorMessage);
    }
  }

  async function handleAdd(photoId: number) {
    markMutating(photoId);
    setErrorMessage(null);

    const persistResult = await persistCurate({
      kind: "add",
      gallery: CURRENT_GALLERY,
      photoId,
    });

    if (persistResult.ok) {
      setPhotos((currentPhotos) =>
        applyPlacementLocally({
          currentPhotos,
          photoId,
          nextPlacement: {
            gallery: CURRENT_GALLERY,
            sortOrder: computeNextSortOrder(currentPhotos, CURRENT_GALLERY),
          },
        }),
      );
    } else {
      setErrorMessage(persistResult.errorMessage);
    }

    clearMutating(photoId);
  }

  async function handleRemove(photoId: number) {
    markMutating(photoId);
    setErrorMessage(null);

    const persistResult = await persistCurate({
      kind: "remove",
      gallery: CURRENT_GALLERY,
      photoId,
    });

    if (persistResult.ok) {
      setPhotos((currentPhotos) =>
        applyPlacementLocally({
          currentPhotos,
          photoId,
          nextPlacement: null,
        }),
      );
    } else {
      setErrorMessage(persistResult.errorMessage);
    }

    clearMutating(photoId);
  }

  function markMutating(photoId: number) {
    setMutatingPhotoIds((previous) => {
      const next = new Set(previous);
      next.add(photoId);
      return next;
    });
  }

  function clearMutating(photoId: number) {
    setMutatingPhotoIds((previous) => {
      const next = new Set(previous);
      next.delete(photoId);
      return next;
    });
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Landing gallery</h1>
        <p className={styles.subheading}>
          Placed photos on the left; pool on the right. Drag to reorder, click
          to add or remove.
        </p>
      </header>

      {errorMessage !== null && (
        <p role="alert" className={styles.errorBanner}>
          {errorMessage}
        </p>
      )}

      <div className={styles.splitView}>
        <section className={styles.pane}>
          <h2 className={styles.paneHeading}>Placed ({placedPhotos.length})</h2>
          {placedPhotos.length === 0 ? (
            <EmptyPlacedState />
          ) : (
            <SortableGrid
              orderedItemIds={placedOrderedIds}
              onOrderChange={handleReorder}
              ariaLabel="Photos placed in the landing gallery, drag to reorder"
            >
              {placedPhotos.map((photo, index) => (
                <Fragment key={photo.photoId}>
                  {index === 0 && (
                    <RowDivider label={`Top row · ${topRowCount}`} />
                  )}
                  {index === topRowCount && (
                    <RowDivider label={`Bottom row · ${bottomRowCount}`} />
                  )}
                  <PlacedCurationTile
                    photo={{
                      photoId: photo.photoId,
                      objectKey: photo.objectKey,
                      width: photo.width,
                      height: photo.height,
                      artistDisplayName: photo.artistDisplayName,
                    }}
                    onRemove={handleRemove}
                    isRemoving={mutatingPhotoIds.has(photo.photoId)}
                  />
                </Fragment>
              ))}
            </SortableGrid>
          )}
        </section>

        <section className={styles.pane}>
          <h2 className={styles.paneHeading}>Pool</h2>
          <CurationFilters
            artistOptions={artistOptions}
            selectedArtistId={selectedArtistId}
            onArtistChange={setSelectedArtistId}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            poolCount={filteredPoolPhotos.length}
          />
          {filteredPoolPhotos.length === 0 ? (
            <EmptyPoolState />
          ) : (
            <ul className={styles.poolGrid} role="list">
              {filteredPoolPhotos.map((photo) => {
                const isBlocked =
                  photo.placement !== null &&
                  photo.placement.gallery !== CURRENT_GALLERY;

                if (isBlocked) {
                  return (
                    <BlockedCurationTile
                      key={photo.photoId}
                      photo={{
                        photoId: photo.photoId,
                        objectKey: photo.objectKey,
                        width: photo.width,
                        height: photo.height,
                        artistDisplayName: photo.artistDisplayName,
                      }}
                      blockedHint={OTHER_GALLERY_LABEL}
                    />
                  );
                }

                return (
                  <PlaceableCurationTile
                    key={photo.photoId}
                    photo={{
                      photoId: photo.photoId,
                      objectKey: photo.objectKey,
                      width: photo.width,
                      height: photo.height,
                      artistDisplayName: photo.artistDisplayName,
                    }}
                    onAdd={handleAdd}
                    isAdding={mutatingPhotoIds.has(photo.photoId)}
                  />
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

/**
 * Non-draggable marker dropped into the placed grid between the two row
 * halves. It isn't wrapped in SortableGridItem, so it doesn't register with
 * dnd-kit and can't be picked up — it's purely a label for the admin.
 */
function RowDivider({ label }: { label: string }) {
  return (
    <li className={styles.rowDivider} role="presentation">
      {label}
    </li>
  );
}

function EmptyPlacedState() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyStateHeading}>Nothing placed yet.</p>
      <p className={styles.emptyStateHint}>
        Click a photo in the pool to add it to the landing gallery.
      </p>
    </div>
  );
}

function EmptyPoolState() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyStateHeading}>No photos match.</p>
      <p className={styles.emptyStateHint}>
        Adjust the filters or upload more photos.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local reducers
// ---------------------------------------------------------------------------

/**
 * Splits the photos list into (a) photos placed in the current gallery, in
 * placement sort_order, and (b) the pool, in the loader's default order
 * (roster then portfolio order). Photos placed in the other gallery live
 * in the pool with `placement` still set — the tile renderer branches on
 * that to render the blocked variant.
 */
function partitionPhotos({
  photos,
  currentGallery,
}: {
  photos: readonly PhotoForCuration[];
  currentGallery: "landing" | "flash";
}): {
  placedPhotos: PhotoForCuration[];
  poolPhotos: PhotoForCuration[];
} {
  const placedPhotos = photos
    .filter(
      (photo) =>
        photo.placement !== null && photo.placement.gallery === currentGallery,
    )
    .sort((a, b) => (a.placement?.sortOrder ?? 0) - (b.placement?.sortOrder ?? 0));

  const poolPhotos = photos.filter(
    (photo) =>
      photo.placement === null || photo.placement.gallery !== currentGallery,
  );

  return { placedPhotos, poolPhotos };
}

function filterPool({
  poolPhotos,
  selectedArtistId,
  selectedCategory,
}: {
  poolPhotos: readonly PhotoForCuration[];
  selectedArtistId: number | null;
  selectedCategory: PhotoCategoryFilter;
}): PhotoForCuration[] {
  return poolPhotos.filter((photo) => {
    if (selectedArtistId !== null && photo.artistId !== selectedArtistId) {
      return false;
    }
    if (selectedCategory !== "all" && photo.category !== selectedCategory) {
      return false;
    }
    return true;
  });
}

/**
 * Optimistic reorder: rebuild every placed photo's sort_order to match the
 * new client-side order. Uses the same 10-step spacing convention as the
 * server; the actual values will be overwritten by the server on success.
 */
function applyReorderLocally({
  currentPhotos,
  currentGallery,
  nextOrderedIds,
}: {
  currentPhotos: readonly PhotoForCuration[];
  currentGallery: "landing" | "flash";
  nextOrderedIds: readonly number[];
}): PhotoForCuration[] {
  const sortOrderByPhotoId = new Map<number, number>();
  nextOrderedIds.forEach((photoId, index) => {
    sortOrderByPhotoId.set(photoId, (index + 1) * 10);
  });

  return currentPhotos.map((photo) => {
    const nextSortOrder = sortOrderByPhotoId.get(photo.photoId);
    if (nextSortOrder === undefined) {
      return photo;
    }
    return {
      ...photo,
      placement: {
        gallery: currentGallery,
        sortOrder: nextSortOrder,
      },
    };
  });
}

function applyPlacementLocally({
  currentPhotos,
  photoId,
  nextPlacement,
}: {
  currentPhotos: readonly PhotoForCuration[];
  photoId: number;
  nextPlacement: PhotoForCuration["placement"];
}): PhotoForCuration[] {
  return currentPhotos.map((photo) =>
    photo.photoId === photoId
      ? { ...photo, placement: nextPlacement }
      : photo,
  );
}

function computeNextSortOrder(
  currentPhotos: readonly PhotoForCuration[],
  gallery: "landing" | "flash",
): number {
  const placedSortOrders = currentPhotos
    .filter(
      (photo) => photo.placement !== null && photo.placement.gallery === gallery,
    )
    .map((photo) => photo.placement?.sortOrder ?? 0);

  const maxSortOrder = placedSortOrders.length === 0 ? 0 : Math.max(...placedSortOrders);
  return maxSortOrder + 10;
}

// ---------------------------------------------------------------------------
// Endpoint call
// ---------------------------------------------------------------------------

type CurateOperationBody =
  | { kind: "add"; gallery: "landing" | "flash"; photoId: number }
  | { kind: "remove"; gallery: "landing" | "flash"; photoId: number }
  | {
      kind: "reorder";
      gallery: "landing" | "flash";
      orderedPhotoIds: readonly number[];
    };

type PersistResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

const FAILURE_MESSAGES: Record<string, string> = {
  already_placed_in_other_gallery:
    "That photo is already placed in the other gallery.",
  not_placed_in_gallery: "That photo is no longer in this gallery.",
  reorder_wrong_count: "The gallery changed. Please refresh and try again.",
  reorder_unknown_ids: "One of the photos is gone. Please refresh.",
  reorder_missing_ids: "The gallery is out of sync. Please refresh.",
  reorder_duplicate_ids: "Something went wrong with the order.",
  persist_failed: "The change didn't save. Please try again.",
  forbidden: "You aren't allowed to do that.",
  wrong_actor: "You aren't allowed to do that.",
};

const GENERIC_FAILURE_MESSAGE = "The change didn't save.";

async function persistCurate(
  body: CurateOperationBody,
): Promise<PersistResult> {
  try {
    const response = await fetch("/admin/api/curate-gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; failureCode: string; detail: string };

    if (payload.ok) {
      return { ok: true };
    }

    // 404-on-remove is idempotent success from the user's perspective.
    if (payload.failureCode === "not_placed_in_gallery" && body.kind === "remove") {
      return { ok: true };
    }

    return {
      ok: false,
      errorMessage:
        FAILURE_MESSAGES[payload.failureCode] ?? GENERIC_FAILURE_MESSAGE,
    };
  } catch (networkError) {
    console.error("[curate] network error:", networkError);
    return {
      ok: false,
      errorMessage: "Couldn't reach the server. Check your connection.",
    };
  }
}