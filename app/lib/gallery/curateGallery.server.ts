import type { Actor } from "~/lib/admin/server/resolveActor.server";
import {
  deleteGalleryPlacement,
  findMaxSortOrderInGallery,
  findPlacedPhotos,
  insertGalleryPlacement,
  rewriteGalleryPlacementSortOrder,
  type GalleryName,
} from "./galleryPlacementRepository.server";


/** Spacing convention shared with artist_photos.sort_order. */
const SORT_ORDER_INCREMENT = 10;

export type CurateGalleryFailureCode =
  | "invalid_operation"
  | "invalid_gallery"
  | "invalid_photo_id"
  | "invalid_ordered_ids"
  | "already_placed_in_other_gallery"
  | "not_placed_in_gallery"
  | "reorder_wrong_count"
  | "reorder_unknown_ids"
  | "reorder_missing_ids"
  | "reorder_duplicate_ids"
  | "persist_failed";

export type CurateGalleryResult =
  | { ok: true }
  | { ok: false; failureCode: CurateGalleryFailureCode; detail: string };

/**
 * The three discriminated operations. Each carries only the fields it
 * needs — an add carries `photoId`, a reorder carries `orderedPhotoIds`.
 * The type shape prevents an add operation from accidentally reading
 * fields that only exist on reorder.
 */
export type CurateGalleryOperation =
  | { kind: "add"; gallery: GalleryName; photoId: number }
  | { kind: "remove"; gallery: GalleryName; photoId: number }
  | {
      kind: "reorder";
      gallery: GalleryName;
      orderedPhotoIds: readonly number[];
    };

export async function curateGallery({
  database,
  actor,
  operation,
}: {
  database: D1Database;
  actor: Extract<Actor, { kind: "admin" }>;
  operation: CurateGalleryOperation;
}): Promise<CurateGalleryResult> {
  // The `actor` parameter is present for future auditing (e.g., logging which
  // admin curated what). Right now it's untouched by the body; a lint warning
  // on that is expected. The alternative — omitting it from the signature —
  // would mean adding it back the day we want an audit log, and every caller
  // would need to update.
  void actor;

  switch (operation.kind) {
    case "add":
      return applyAdd({ database, operation });
    case "remove":
      return applyRemove({ database, operation });
    case "reorder":
      return applyReorder({ database, operation });
  }
}

async function applyAdd({
  database,
  operation,
}: {
  database: D1Database;
  operation: Extract<CurateGalleryOperation, { kind: "add" }>;
}): Promise<CurateGalleryResult> {
  const maxSortOrder = await findMaxSortOrderInGallery({
    database,
    gallery: operation.gallery,
  });

  const nextSortOrder = maxSortOrder + SORT_ORDER_INCREMENT;

  const insertResult = await insertGalleryPlacement({
    database,
    photoId: operation.photoId,
    gallery: operation.gallery,
    sortOrder: nextSortOrder,
  });

  if (insertResult.ok) {
    return { ok: true };
  }

  if (insertResult.failureCode === "already_placed") {
    // The mutual-exclusion PK triggers this on any second placement,
    // regardless of which gallery. Message aimed at the curator, who
    // sees a specific photo and needs to know why they can't add it.
    return {
      ok: false,
      failureCode: "already_placed_in_other_gallery",
      detail: "This photo is already placed in one of the galleries.",
    };
  }

  return {
    ok: false,
    failureCode: "persist_failed",
    detail: "Could not add the photo to the gallery.",
  };
}

async function applyRemove({
  database,
  operation,
}: {
  database: D1Database;
  operation: Extract<CurateGalleryOperation, { kind: "remove" }>;
}): Promise<CurateGalleryResult> {
  const deleteResult = await deleteGalleryPlacement({
    database,
    photoId: operation.photoId,
    gallery: operation.gallery,
  });

  if (!deleteResult.rowMatched) {
    // The row wasn't there — either it never was, or another admin just
    // removed it. Either way, the desired end state (photo is not in
    // this gallery) already holds; the endpoint will translate to 404
    // for observability but the curator's UI treats it as success.
    return {
      ok: false,
      failureCode: "not_placed_in_gallery",
      detail: "The photo is not placed in this gallery.",
    };
  }

  return { ok: true };
}

async function applyReorder({
  database,
  operation,
}: {
  database: D1Database;
  operation: Extract<CurateGalleryOperation, { kind: "reorder" }>;
}): Promise<CurateGalleryResult> {
  const { orderedPhotoIds } = operation;

  const duplicateCheckResult = ensureNoDuplicates(orderedPhotoIds);

  if (!duplicateCheckResult.ok) {
    return duplicateCheckResult;
  }

  const currentPlacements = await findPlacedPhotos({
    database,
    gallery: operation.gallery,
  });
  const currentPhotoIds = new Set(
    currentPlacements.map((placement) => placement.photoId),
  );
  const submittedPhotoIds = new Set(orderedPhotoIds);

  const setMatchResult = ensureExactSetMatch({
    currentPhotoIds,
    submittedPhotoIds,
    submittedLength: orderedPhotoIds.length,
    currentLength: currentPlacements.length,
  });

  if (!setMatchResult.ok) {
    return setMatchResult;
  }

  try {
    await rewriteGalleryPlacementSortOrder({
      database,
      gallery: operation.gallery,
      photoIdsInOrder: orderedPhotoIds,
      sortOrderIncrement: SORT_ORDER_INCREMENT,
    });
    return { ok: true };
  } catch (persistError) {
    console.error("[curateGallery] reorder persist failed:", persistError);
    return {
      ok: false,
      failureCode: "persist_failed",
      detail: "Could not save the new order.",
    };
  }
}

function ensureNoDuplicates(
  orderedPhotoIds: readonly number[],
):
  | { ok: true }
  | Extract<CurateGalleryResult, { ok: false }> {
  const seenIds = new Set<number>();

  for (const photoId of orderedPhotoIds) {
    if (seenIds.has(photoId)) {
      return {
        ok: false,
        failureCode: "reorder_duplicate_ids",
        detail: `Photo id ${photoId} appears more than once in the submitted order.`,
      };
    }
    seenIds.add(photoId);
  }

  return { ok: true };
}

function ensureExactSetMatch({
  currentPhotoIds,
  submittedPhotoIds,
  submittedLength,
  currentLength,
}: {
  currentPhotoIds: Set<number>;
  submittedPhotoIds: Set<number>;
  submittedLength: number;
  currentLength: number;
}):
  | { ok: true }
  | Extract<CurateGalleryResult, { ok: false }> {
  if (submittedLength !== currentLength) {
    return {
      ok: false,
      failureCode: "reorder_wrong_count",
      detail: `Expected ${currentLength} ids, got ${submittedLength}.`,
    };
  }

  for (const submittedId of submittedPhotoIds) {
    if (!currentPhotoIds.has(submittedId)) {
      return {
        ok: false,
        failureCode: "reorder_unknown_ids",
        detail: `Photo id ${submittedId} is not placed in this gallery.`,
      };
    }
  }

  for (const currentId of currentPhotoIds) {
    if (!submittedPhotoIds.has(currentId)) {
      return {
        ok: false,
        failureCode: "reorder_missing_ids",
        detail: `Photo id ${currentId} is missing from the submitted order.`,
      };
    }
  }

  return { ok: true };
}