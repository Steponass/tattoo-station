// app/routes/admin.me.photos.tsx

import { useState } from "react";
import { data, Link } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { adminActorContext } from "~/lib/admin/server/adminActorContext.server";
import { requireArtist } from "~/lib/admin/server/routeGuards.server";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import {
  findArtistPhotosByCategory,
  summarizeArtistPhotos,
} from "~/lib/artists/artistPhotoRepository.server";
import { mainPhotoCategoryForRole } from "~/lib/artists/artistPhotoCategories";
import type { ArtistPhotoCategory } from "~/lib/artists/artistPhotoCategories";
import { SortableGrid } from "~/components/admin/sortable/SortableGrid";
import PhotoTile from "~/components/admin/profile/PhotoTile";
import PhotoUploader from "~/components/admin/profile/PhotoUploader";
import type { Route } from "./+types/admin.me.photos";
import styles from "./admin.me.photos.module.css";

export async function loader({ context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = requireArtist(context.get(adminActorContext), "/admin");

  const artistProfile = await findArtistProfileForEditing({
    database: env.DB,
    artistId: actor.artistId,
  });

  if (artistProfile === null) {
    throw data("Artist not found", { status: 404 });
  }

  const mainPhotoCategory = mainPhotoCategoryForRole(artistProfile.role);

  const photos = await findArtistPhotosByCategory({
    database: env.DB,
    artistId: actor.artistId,
    category: mainPhotoCategory,
  });

  // The upload cap spans every category (tattoo/piercing + flash), not just
  // the category this grid displays, so the uploader needs the artist's
  // total count rather than photos.length.
  const summary = await summarizeArtistPhotos({
    database: env.DB,
    artistId: actor.artistId,
  });

  return {
    displayName: artistProfile.displayName,
    mainPhotoCategory,
    photos,
    totalPhotoCount: summary.count,
  };
}

type Photo = {
  id: number;
  objectKey: string;
  width: number;
  height: number;
  style: string | null;
};

export default function AdminMePhotosPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    displayName,
    mainPhotoCategory,
    photos: initialPhotos,
    totalPhotoCount: initialTotalPhotoCount,
  } = loaderData;

  const [photos, setPhotos] = useState<Photo[]>(() =>
    initialPhotos.map((photo) => ({
      id: photo.id,
      objectKey: photo.objectKey,
      width: photo.width,
      height: photo.height,
      style: photo.style,
    })),
  );
  const [totalPhotoCount, setTotalPhotoCount] = useState(
    initialTotalPhotoCount,
  );
  const [deletingPhotoIds, setDeletingPhotoIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [styleUpdatingPhotoIds, setStyleUpdatingPhotoIds] = useState<
    Set<number>
  >(() => new Set());
  const [reorderErrorMessage, setReorderErrorMessage] = useState<string | null>(
    null,
  );
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );
  const [styleErrorMessage, setStyleErrorMessage] = useState<string | null>(
    null,
  );

  const orderedPhotoIds = photos.map((photo) => photo.id);

  function handlePhotoUploaded(uploadedPhoto: Photo) {
    setPhotos((previous) => [...previous, uploadedPhoto]);
    setTotalPhotoCount((previous) => previous + 1);
  }

  async function handleOrderChange(nextOrderedIds: number[]) {
    // Snapshot the previous order so we can roll back if the server rejects
    // the new one. Optimistic UI: the grid updates immediately; the server
    // catches up in the background; on failure we revert.
    const previousPhotos = photos;

    const nextPhotos = nextOrderedIds
      .map((photoId) => photos.find((photo) => photo.id === photoId))
      .filter((photo): photo is Photo => photo !== undefined);

    setPhotos(nextPhotos);
    setReorderErrorMessage(null);

    const persistResult = await persistReorder({
      category: mainPhotoCategory,
      orderedPhotoIds: nextOrderedIds,
    });

    if (!persistResult.ok) {
      setPhotos(previousPhotos);
      setReorderErrorMessage(persistResult.errorMessage);
    }
  }

  async function handleDelete(photoId: number) {
    setDeletingPhotoIds((previous) => {
      const next = new Set(previous);
      next.add(photoId);
      return next;
    });
    setDeleteErrorMessage(null);

    const deleteResult = await persistDelete({ photoId });

    if (deleteResult.ok) {
      setPhotos((previous) => previous.filter((photo) => photo.id !== photoId));
      setTotalPhotoCount((previous) => previous - 1);
    } else {
      setDeleteErrorMessage(deleteResult.errorMessage);
    }

    setDeletingPhotoIds((previous) => {
      const next = new Set(previous);
      next.delete(photoId);
      return next;
    });
  }

  async function handleStyleChange(photoId: number, nextStyle: string | null) {
    const previousPhotos = photos;

    setPhotos((previous) =>
      previous.map((photo) =>
        photo.id === photoId ? { ...photo, style: nextStyle } : photo,
      ),
    );
    setStyleUpdatingPhotoIds((previous) => {
      const next = new Set(previous);
      next.add(photoId);
      return next;
    });
    setStyleErrorMessage(null);

    const persistResult = await persistStyleChange({ photoId, style: nextStyle });

    if (!persistResult.ok) {
      setPhotos(previousPhotos);
      setStyleErrorMessage(persistResult.errorMessage);
    }

    setStyleUpdatingPhotoIds((previous) => {
      const next = new Set(previous);
      next.delete(photoId);
      return next;
    });
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.heading}>Your photos</h1>
          <p className={styles.subheading}>{displayName}</p>
        </div>
        <Link to="/admin/me" className={styles.backLink}>
          Back to profile
        </Link>
      </header>

      <PhotoUploader
        currentPhotoCount={totalPhotoCount}
        onPhotoUploaded={handlePhotoUploaded}
      />

      {reorderErrorMessage !== null && (
        <p role="alert" className={styles.mutationError}>
          {reorderErrorMessage}
        </p>
      )}

      {deleteErrorMessage !== null && (
        <p role="alert" className={styles.mutationError}>
          {deleteErrorMessage}
        </p>
      )}

      {styleErrorMessage !== null && (
        <p role="alert" className={styles.mutationError}>
          {styleErrorMessage}
        </p>
      )}

      {photos.length === 0 ? (
        <EmptyState />
      ) : (
        <SortableGrid
          orderedItemIds={orderedPhotoIds}
          onOrderChange={handleOrderChange}
          ariaLabel="Your photos, drag to reorder"
        >
          {photos.map((photo) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              onDelete={handleDelete}
              isDeleting={deletingPhotoIds.has(photo.id)}
              onStyleChange={handleStyleChange}
              isUpdatingStyle={styleUpdatingPhotoIds.has(photo.id)}
            />
          ))}
        </SortableGrid>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyStateHeading}>No photos yet.</p>
      <p className={styles.emptyStateHint}>
        Use the upload button above to add your first photo.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

/**
 * Reorder and delete are called from event handlers, not fetchers. The
 * reason: fetcher.data is a single slot per fetcher, and we'd need two
 * fetchers to run reorder and delete concurrently (deleting during a
 * pending reorder, say). A plain fetch() per operation is simpler and
 * more honest about the concurrency model.
 *
 * A trade-off: we lose fetcher.state's built-in pending indicator, so the
 * component tracks pending states via its own useStates. That is the
 * shape we want anyway — per-photo delete pending, not per-page.
 */

type PersistResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

const REORDER_FAILURE_MESSAGES: Record<string, string> = {
  reorder_wrong_count:
    "The photo list changed. Please refresh and try again.",
  reorder_unknown_ids:
    "One of the photos is no longer available. Please refresh.",
  reorder_missing_ids:
    "The photo list is out of sync. Please refresh.",
  reorder_duplicate_ids:
    "Something went wrong with the order. Please try again.",
  invalid_category:
    "The photo list is out of sync. Please refresh.",
  category_not_editable_by_artist:
    "You can't reorder those photos.",
  persist_failed:
    "The new order didn't save. Please try again.",
};

const DELETE_FAILURE_MESSAGES: Record<string, string> = {
  photo_not_found: "That photo has already been removed.",
  d1_delete_failed: "The photo couldn't be deleted. Please try again.",
};

const STYLE_FAILURE_MESSAGES: Record<string, string> = {
  invalid_style: "That's not a recognized style.",
  photo_not_found: "That photo has already been removed.",
  d1_update_failed: "The style couldn't be saved. Please try again.",
};

async function persistReorder({
  category,
  orderedPhotoIds,
}: {
  category: ArtistPhotoCategory;
  orderedPhotoIds: number[];
}): Promise<PersistResult> {
  try {
    const response = await fetch("/admin/api/artist-photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, orderedPhotoIds }),
    });

    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; failureCode: string; detail: string };

    if (payload.ok) {
      return { ok: true };
    }

    return {
      ok: false,
      errorMessage:
        REORDER_FAILURE_MESSAGES[payload.failureCode] ??
        "The new order didn't save.",
    };
  } catch (networkError) {
    console.error("[reorder] network error:", networkError);
    return {
      ok: false,
      errorMessage: "Couldn't reach the server. Check your connection.",
    };
  }
}

async function persistDelete({
  photoId,
}: {
  photoId: number;
}): Promise<PersistResult> {
  try {
    const response = await fetch("/admin/api/artist-photos/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });

    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; failureCode: string; detail: string };

    if (payload.ok) {
      return { ok: true };
    }

    // photo_not_found means the photo is gone — from the user's perspective
    // that's a success even though the server returned an error. Treat it
    // as such to avoid a confusing "already deleted" banner.
    if (payload.failureCode === "photo_not_found") {
      return { ok: true };
    }

    return {
      ok: false,
      errorMessage:
        DELETE_FAILURE_MESSAGES[payload.failureCode] ??
        "The photo couldn't be deleted.",
    };
  } catch (networkError) {
    console.error("[delete] network error:", networkError);
    return {
      ok: false,
      errorMessage: "Couldn't reach the server. Check your connection.",
    };
  }
}

async function persistStyleChange({
  photoId,
  style,
}: {
  photoId: number;
  style: string | null;
}): Promise<PersistResult> {
  try {
    const response = await fetch("/admin/api/artist-photos/style", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, style }),
    });

    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; failureCode: string; detail: string };

    if (payload.ok) {
      return { ok: true };
    }

    return {
      ok: false,
      errorMessage:
        STYLE_FAILURE_MESSAGES[payload.failureCode] ??
        "The style couldn't be saved.",
    };
  } catch (networkError) {
    console.error("[style] network error:", networkError);
    return {
      ok: false,
      errorMessage: "Couldn't reach the server. Check your connection.",
    };
  }
}