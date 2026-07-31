// app/lib/artists/reorderRoster.server.ts

import { findAdminRoster } from "./artistRepository.server";
import { rewriteArtistSortOrder } from "./artistProfileRepository.server";

/**
 * The one place roster reordering happens. Called from the reorder-roster
 * endpoint; the route action is a five-line delegation.
 *
 * Admin-only. The route rejects non-admin actors before ever reaching this
 * function; the service itself has no actor check because the endpoint is
 * its only caller and the gate lives there.
 *
 * The exact-set-match rule: the submitted list must be exactly the current
 * roster — same length, same ids, no extras, no duplicates. This mirrors
 * the artist-photo reorder validator: submitting stale or malformed data
 * produces a specific error code the client can translate to actionable
 * copy ("the roster changed, please refresh") rather than a generic 500.
 */

const SORT_ORDER_INCREMENT = 10;

export type ReorderRosterFailureCode =
  | "invalid_ordered_ids"
  | "reorder_wrong_count"
  | "reorder_unknown_ids"
  | "reorder_missing_ids"
  | "reorder_duplicate_ids"
  | "persist_failed";

export type ReorderRosterResult =
  | { ok: true }
  | { ok: false; failureCode: ReorderRosterFailureCode; detail: string };

export async function reorderRoster({
  database,
  orderedArtistIds,
}: {
  database: D1Database;
  orderedArtistIds: readonly number[];
}): Promise<ReorderRosterResult> {
  const duplicateCheckResult = ensureNoDuplicates(orderedArtistIds);

  if (!duplicateCheckResult.ok) {
    return duplicateCheckResult;
  }

  const currentRoster = await findAdminRoster({ database });
  const currentArtistIds = new Set(currentRoster.map((entry) => entry.id));
  const submittedArtistIds = new Set(orderedArtistIds);

  const setMatchResult = ensureExactSetMatch({
    currentArtistIds,
    submittedArtistIds,
    submittedLength: orderedArtistIds.length,
    currentLength: currentRoster.length,
  });

  if (!setMatchResult.ok) {
    return setMatchResult;
  }

  try {
    await rewriteArtistSortOrder({
      database,
      artistIdsInOrder: orderedArtistIds,
      sortOrderIncrement: SORT_ORDER_INCREMENT,
    });
    return { ok: true };
  } catch (persistError) {
    console.error("[reorderRoster] persist failed:", persistError);
    return {
      ok: false,
      failureCode: "persist_failed",
      detail: "Could not save the new roster order.",
    };
  }
}

function ensureNoDuplicates(
  orderedArtistIds: readonly number[],
): { ok: true } | Extract<ReorderRosterResult, { ok: false }> {
  const seenIds = new Set<number>();

  for (const artistId of orderedArtistIds) {
    if (seenIds.has(artistId)) {
      return {
        ok: false,
        failureCode: "reorder_duplicate_ids",
        detail: `Artist id ${artistId} appears more than once in the submitted order.`,
      };
    }
    seenIds.add(artistId);
  }

  return { ok: true };
}

function ensureExactSetMatch({
  currentArtistIds,
  submittedArtistIds,
  submittedLength,
  currentLength,
}: {
  currentArtistIds: Set<number>;
  submittedArtistIds: Set<number>;
  submittedLength: number;
  currentLength: number;
}): { ok: true } | Extract<ReorderRosterResult, { ok: false }> {
  if (submittedLength !== currentLength) {
    return {
      ok: false,
      failureCode: "reorder_wrong_count",
      detail: `Expected ${currentLength} ids, got ${submittedLength}.`,
    };
  }

  for (const submittedId of submittedArtistIds) {
    if (!currentArtistIds.has(submittedId)) {
      return {
        ok: false,
        failureCode: "reorder_unknown_ids",
        detail: `Artist id ${submittedId} is not in the roster.`,
      };
    }
  }

  for (const currentId of currentArtistIds) {
    if (!submittedArtistIds.has(currentId)) {
      return {
        ok: false,
        failureCode: "reorder_missing_ids",
        detail: `Artist id ${currentId} is missing from the submitted order.`,
      };
    }
  }

  return { ok: true };
}