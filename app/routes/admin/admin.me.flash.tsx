// app/routes/admin.me.flash.tsx

import { useState } from "react";
import { data, redirect } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import { findArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import { findArtistPhotosByCategory } from "~/lib/artists/artistPhotoRepository.server";
import { SortableGrid } from "~/components/admin/sortable/SortableGrid";
import PhotoTile from "~/components/admin/profile/PhotoTile";
import PhotoUploader from "~/components/admin/profile/PhotoUploader";
import type { Route } from "../+types/admin.me.flash";
import styles from "./admin.me.photos.module.css";

/**
 * The artist's flash-designs grid. Structurally identical to
 * /admin/me/photos: same SortableGrid, PhotoTile, and PhotoUploader
 * components; same optimistic reorder, pessimistic delete, sequential
 * upload flow. What differs is the category the loader reads and the
 * `surface` value the uploader passes.
 *
 * Piercer role cannot reach this page: §6 of the handoff hides the flash
 * tab for role=piercing. The loader redirects them to /admin/me rather
 * than 404-ing, because a 404 for a page that never existed for them is
 * misleading; a redirect is honest.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    throw data("Forbidden", { status: 403 });
  }

  if (actor.kind === "admin") {
    throw redirect("/admin");
  }

  const artistProfile = await findArtistProfileForEditing({
    database: env.DB,
    artistId: actor.artistId,
  });

  if (artistProfile === null) {
    throw data("Artist not found", { status: 404 });
  }

  if (artistProfile.role === "piercing") {
    // Flash isn't part of a piercer's world. Redirect rather than 404 —
    // the page doesn't exist for them, so send them somewhere that does.
    throw redirect("/admin/me");
  }

  const photos = await findArtistPhotosByCategory({
    database: env.DB,
    artistId: actor.artistId,
    category: "flash",
  });

  return {
    displayName: artistProfile.displayName,
    photos,
  };
}

type Photo = {
  id: number;
  objectKey: string;
  width: number;
  height: number;
};

export default function AdminMeFlashPage({
  loaderData,
}: Route.ComponentProps) {
  const { displayName, photos: initialPhotos } = loaderData;

  const [photos, setPhotos] = useState<Photo[]>(() =>
    initialPhotos.map((photo) => ({
      id: photo.id,
      objectKey: photo.objectKey,
      width: photo.width,
      height: photo.height,
    })),
  );
  const [deletingPhotoIds, setDeletingPhotoIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [reorderErrorMessage, setReorderErrorMessage] = useState<string | null>(
    null,
  );
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );

  const orderedPhotoIds = photos.map((photo) => photo.id);

  function handlePhotoUploaded(uploadedPhoto: Photo) {
    setPhotos((previous) => [...previous, uploadedPhoto]);
  }

  async function handleOrderChange(nextOrderedIds: number[]) {
    const previousPhotos = photos;

    const nextPhotos = nextOrderedIds
      .map((photoId) => photos.find((photo) => photo.id === photoId))
      .filter((photo): photo is Photo => photo !== undefined);

    setPhotos(nextPhotos);
    setReorderErrorMessage(null);

    const persistResult = await persistReorder({
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
    } else {
      setDeleteErrorMessage(deleteResult.errorMessage);
    }

    setDeletingPhotoIds((previous) => {
      const next = new Set(previous);
      next.delete(photoId);
      return next;
    });
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Your flash</h1>
        <p className={styles.subheading}>{displayName}</p>
      </header>

      <PhotoUploader
        currentPhotoCount={photos.length}
        surface="flash"
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

      {photos.length === 0 ? (
        <EmptyState />
      ) : (
        <SortableGrid
          orderedItemIds={orderedPhotoIds}
          onOrderChange={handleOrderChange}
          ariaLabel="Your flash designs, drag to reorder"
        >
          {photos.map((photo) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              onDelete={handleDelete}
              isDeleting={deletingPhotoIds.has(photo.id)}
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
      <p className={styles.emptyStateHeading}>No flash designs yet.</p>
      <p className={styles.emptyStateHint}>
        Use the upload button above to add your first flash design.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

type PersistResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

const REORDER_FAILURE_MESSAGES: Record<string, string> = {
  reorder_wrong_count:
    "The photo list changed. Please refresh and try again.",
  reorder_unknown_ids:
    "One of the designs is no longer available. Please refresh.",
  reorder_missing_ids:
    "The design list is out of sync. Please refresh.",
  reorder_duplicate_ids:
    "Something went wrong with the order. Please try again.",
  invalid_category:
    "The design list is out of sync. Please refresh.",
  category_not_editable_by_artist:
    "You can't reorder those designs.",
  persist_failed:
    "The new order didn't save. Please try again.",
};

const DELETE_FAILURE_MESSAGES: Record<string, string> = {
  photo_not_found: "That design has already been removed.",
  d1_delete_failed: "The design couldn't be deleted. Please try again.",
};

async function persistReorder({
  orderedPhotoIds,
}: {
  orderedPhotoIds: number[];
}): Promise<PersistResult> {
  try {
    const response = await fetch("/api/artist-photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "flash", orderedPhotoIds }),
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
    const response = await fetch("/api/artist-photos/delete", {
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

    if (payload.failureCode === "photo_not_found") {
      return { ok: true };
    }

    return {
      ok: false,
      errorMessage:
        DELETE_FAILURE_MESSAGES[payload.failureCode] ??
        "The design couldn't be deleted.",
    };
  } catch (networkError) {
    console.error("[delete] network error:", networkError);
    return {
      ok: false,
      errorMessage: "Couldn't reach the server. Check your connection.",
    };
  }
}