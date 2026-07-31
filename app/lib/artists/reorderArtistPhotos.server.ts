// app/lib/artists/reorderArtistPhotos.server.ts

import type { ArtistPhotoCategory } from "./artistPhotoCategories";
import type { ArtistRole } from "./artistTypes";
import { mainPhotoCategoryForRole } from "./artistPhotoCategories";
import { findArtistPhotosByCategory } from "./artistPhotoRepository.server";
import { rewriteArtistPhotoSortOrder } from "./artistPhotoRepository.server";

/**
 * The one place photo reordering happens. Called from api.artist-photos.reorder.ts;
 * a route action is a five-line delegation.
 *
 * Two invariants enforced here, not at the route:
 *
 * 1. Actor-pinning: the artistId passed in is the one written against. Callers
 *    resolve it from the actor; the route never forwards a form value.
 *
 * 2. Category-scoping: an artist may only reorder the categories they can
 *    touch — their main-photo category (derived from role) and, if not a
 *    piercer, their flash category. The service refuses reorders in other
 *    categories, even though the artist owns rows there (a piercer trying to
 *    reorder their piercing photos hits the main-photo category branch, which
 *    resolves to "piercing" for them — no gate needed for the main case).
 *
 * The exact-set-match rule (§7 of the handoff): the submitted list must be
 * exactly the artist's rows for that category — same length, same ids, no
 * extras, no duplicates. Any deviation is a rejection with a specific code,
 * because the failure modes suggest different client-side bugs:
 *   - wrong count: the list is stale or the client added/removed clientside
 *   - unknown ids: the client submitted ids from another artist or category
 *   - missing ids: the list omits photos the artist owns
 *   - duplicate ids: the client is malformed
 */

/** Gap between sort_order values, matching the project's 10/20/30 seed spacing. */
const SORT_ORDER_INCREMENT = 10;

export type ReorderArtistPhotosFailureCode =
  | "invalid_ordered_ids"
  | "invalid_category"
  | "category_not_editable_by_artist"
  | "reorder_wrong_count"
  | "reorder_unknown_ids"
  | "reorder_missing_ids"
  | "reorder_duplicate_ids"
  | "persist_failed";

export type ReorderArtistPhotosResult =
  | { ok: true }
  | {
      ok: false;
      failureCode: ReorderArtistPhotosFailureCode;
      detail: string;
    };

export type ReorderArtistPhotosInput = {
  database: D1Database;
  artistId: number;
  artistRole: ArtistRole;
  category: ArtistPhotoCategory;
  orderedPhotoIds: readonly number[];
};

export async function reorderArtistPhotos(
  input: ReorderArtistPhotosInput,
): Promise<ReorderArtistPhotosResult> {
  const { database, artistId, artistRole, category, orderedPhotoIds } = input;

  const categoryGateResult = ensureCategoryEditableByArtist({
    artistRole,
    category,
  });

  if (!categoryGateResult.ok) {
    return categoryGateResult;
  }

  const duplicateCheckResult = ensureNoDuplicates(orderedPhotoIds);

  if (!duplicateCheckResult.ok) {
    return duplicateCheckResult;
  }

  const currentPhotos = await findArtistPhotosByCategory({
    database,
    artistId,
    category,
  });
  const currentPhotoIds = new Set(currentPhotos.map((photo) => photo.id));
  const submittedPhotoIds = new Set(orderedPhotoIds);

  const setMatchResult = ensureExactSetMatch({
    currentPhotoIds,
    submittedPhotoIds,
    submittedLength: orderedPhotoIds.length,
    currentLength: currentPhotos.length,
  });

  if (!setMatchResult.ok) {
    return setMatchResult;
  }

  try {
    await rewriteArtistPhotoSortOrder({
      database,
      photoIdsInOrder: orderedPhotoIds,
      sortOrderIncrement: SORT_ORDER_INCREMENT,
    });
    return { ok: true };
  } catch (persistError) {
    console.error("[reorderArtistPhotos] persist failed:", persistError);
    return {
      ok: false,
      failureCode: "persist_failed",
      detail: "Could not save the new order. Please try again.",
    };
  }
}

/**
 * The categories an artist may write to. Piercer can touch "piercing" only;
 * tattoo/both can touch their main category ("tattoo") and "flash". Admin
 * doesn't reach this service — the route rejects non-artist callers.
 */
function ensureCategoryEditableByArtist({
  artistRole,
  category,
}: {
  artistRole: ArtistRole;
  category: ArtistPhotoCategory;
}): { ok: true } | Extract<ReorderArtistPhotosResult, { ok: false }> {
  const mainCategory = mainPhotoCategoryForRole(artistRole);

  if (category === mainCategory) {
    return { ok: true };
  }

  if (category === "flash" && artistRole !== "piercing") {
    return { ok: true };
  }

  return {
    ok: false,
    failureCode: "category_not_editable_by_artist",
    detail: `Artists with role "${artistRole}" cannot reorder the "${category}" category.`,
  };
}

function ensureNoDuplicates(
  orderedPhotoIds: readonly number[],
): { ok: true } | Extract<ReorderArtistPhotosResult, { ok: false }> {
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
}): { ok: true } | Extract<ReorderArtistPhotosResult, { ok: false }> {
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
        detail: `Photo id ${submittedId} is not one of this artist's photos in this category.`,
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
