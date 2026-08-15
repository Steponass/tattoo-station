// app/routes/admin.artists.$id.photos.tsx

import { useState } from "react";
import { data, redirect } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
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
import type { Route } from "./+types/admin.artists.$id.photos";
import styles from "./admin.me.photos.module.css";

/**
 * The admin's editor for a single artist's main photo grid. Structurally
 * identical to /admin/me/photos: same SortableGrid, PhotoTile, and
 * PhotoUploader components, same optimistic reorder / pessimistic delete
 * flow. What differs is that every mutation targets `params.id` instead of
 * the caller's own artistId, matching the actor-branching already in place
 * on the upload/delete/reorder endpoints.
 */
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    throw data("Forbidden", { status: 403 });
  }

  if (actor.kind === "artist") {
    throw redirect("/admin/me/photos");
  }

  const targetArtistId = parseArtistIdFromParam(params.id);

  if (targetArtistId === null) {
    throw data("Not Found", { status: 404 });
  }

  const artistProfile = await findArtistProfileForEditing({
    database: env.DB,
    artistId: targetArtistId,
  });

  if (artistProfile === null) {
    throw data("Not Found", { status: 404 });
  }

  const mainPhotoCategory = mainPhotoCategoryForRole(artistProfile.role);

  const photos = await findArtistPhotosByCategory({
    database: env.DB,
    artistId: targetArtistId,
    category: mainPhotoCategory,
  });

  // The upload cap spans every category (tattoo/piercing + flash), not just
  // the category this grid displays, so the uploader needs the artist's
  // total count rather than photos.length.
  const summary = await summarizeArtistPhotos({
    database: env.DB,
    artistId: targetArtistId,
  });

  return {
    displayName: artistProfile.displayName,
    mainPhotoCategory,
    targetArtistId,
    photos,
    totalPhotoCount: summary.count,
  };
}

function parseArtistIdFromParam(rawParam: string | undefined): number | null {
  if (rawParam === undefined) {
    return null;
  }

  const parsed = Number(rawParam);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

type Photo = {
  id: number;
  objectKey: string;
  width: number;
  height: number;
  style: string | null;
};

export default function AdminArtistPhotosPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    displayName,
    mainPhotoCategory,
    targetArtistId,
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
    const previousPhotos = photos;

    const nextPhotos = nextOrderedIds
      .map((photoId) => photos.find((photo) => photo.id === photoId))
      .filter((photo): photo is Photo => photo !== undefined);

    setPhotos(nextPhotos);
    setReorderErrorMessage(null);

    const persistResult = await persistReorder({
      artistId: targetArtistId,
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

    const deleteResult = await persistDelete({
      artistId: targetArtistId,
      photoId,
    });

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

    const persistResult = await persistStyleChange({
      artistId: targetArtistId,
      photoId,
      style: nextStyle,
    });

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
        <h1 className={styles.heading}>Editing {displayName}'s photos</h1>
        <p className={styles.subheading}>Admin editor.</p>
      </header>

      <PhotoUploader
        currentPhotoCount={totalPhotoCount}
        targetArtistIdForAdmin={targetArtistId}
        category={mainPhotoCategory}
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
          ariaLabel={`${displayName}'s photos, drag to reorder`}
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
        Use the upload button above to add the first photo.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

type PersistResult = { ok: true } | { ok: false; errorMessage: string };

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
  artistId,
  category,
  orderedPhotoIds,
}: {
  artistId: number;
  category: ArtistPhotoCategory;
  orderedPhotoIds: number[];
}): Promise<PersistResult> {
  try {
    const response = await fetch("/admin/api/artist-photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId, category, orderedPhotoIds }),
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
  artistId,
  photoId,
}: {
  artistId: number;
  photoId: number;
}): Promise<PersistResult> {
  try {
    const response = await fetch("/admin/api/artist-photos/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId, photoId }),
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
  artistId,
  photoId,
  style,
}: {
  artistId: number;
  photoId: number;
  style: string | null;
}): Promise<PersistResult> {
  try {
    const response = await fetch("/admin/api/artist-photos/style", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId, photoId, style }),
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
