// app/components/Lightbox/useLightboxState.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LightboxPhoto } from "./lightboxPhoto";

/**
 * The public shape of the state machine. Everything the Lightbox component
 * needs to render the UI and everything the LightboxTrigger needs to open
 * a photo. Kept as a plain object so the return type can be documented in
 * one place and imported by other files (e.g. tests, or a future context
 * that re-exports this shape).
 */
export interface LightboxState {
  /** The id of the currently displayed photo, or null when closed. */
  currentPhotoId: LightboxPhoto["id"] | null;
  /**
   * The resolved photo object, or null when closed or when the current
   * id no longer matches any photo in the array (e.g. photos changed
   * from under us). The component renders nothing in that case.
   */
  currentPhoto: LightboxPhoto | null;
  /**
   * Position of currentPhoto in the photos array, or -1 when there is no
   * current photo. Exposed so the component can display "3 / 12" style
   * counters later without recomputing.
   */
  currentIndex: number;
  /** True when there is a photo before the current one. */
  hasPrevious: boolean;
  /** True when there is a photo after the current one. */
  hasNext: boolean;

  open: (photoId: LightboxPhoto["id"]) => void;
  close: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
}

interface UseLightboxStateInput {
  photos: readonly LightboxPhoto[];
}

/**
 * State machine for the Lightbox. Owns the currently-open photo id and
 * exposes the four transition methods (open, close, prev, next) plus the
 * derived values the UI needs.
 *
 * Also syncs bidirectionally with `location.hash`:
 *
 *   - Opening pushes a new history entry (`#photo-<id>`). Back button
 *     closes the lightbox.
 *   - Prev/next replaces the hash in place. Back does not walk through
 *     every photo the visitor browsed — it closes.
 *   - Close pops the history entry (via history.back), which restores
 *     the URL as if the visitor had never opened the lightbox.
 *   - On mount, an existing `#photo-<id>` opens the lightbox at that
 *     photo, provided it exists in the photos array.
 *   - `popstate` (browser back/forward) is read and synced into React
 *     state — that path handles back-button-closes and forward-button-
 *     reopens without our own writes fighting the listener.
 *
 * The hook stays DOM-agnostic beyond `window.location` and
 * `window.history`. No dialog element, no focus management, no
 * keyboard listeners — those are the component's job.
 */
export function useLightboxState(input: UseLightboxStateInput): LightboxState {
  const { photos } = input;

  const [currentPhotoId, setCurrentPhotoId] = useState<
    LightboxPhoto["id"] | null
  >(null);

  const currentIndex = useMemo(() => {
    if (currentPhotoId === null) {
      return -1;
    }
    return photos.findIndex((photo) => photo.id === currentPhotoId);
  }, [photos, currentPhotoId]);

  const currentPhoto = useMemo(() => {
    if (currentIndex === -1) {
      return null;
    }
    return photos[currentIndex];
  }, [photos, currentIndex]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photos.length - 1;

  /* --------------------- Deep-link on initial mount ------------------- */
  // If the URL already has `#photo-<id>` when the component mounts, open
  // that photo. Client-only — hash is not available on the server, so
  // this runs after hydration.
  useEffect(() => {
    const hashPhotoId = readPhotoIdFromHash(window.location.hash, photos);
    if (hashPhotoId === null) {
      return;
    }
    setCurrentPhotoId(hashPhotoId);
    // Deliberately empty deps: this fires once on mount, matching the
    // "landed on the page with a hash" case. If `photos` arrives later
    // (e.g. from a client loader), we'd need a different approach — for
    // now every consumer resolves photos synchronously in its loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------- Browser back/forward → state ------------------- */
  // popstate fires when the user navigates history. We read the hash
  // that resulted and update state to match. This is the ONLY listener
  // that writes state from the hash; our own open/close/prev/next
  // methods write state directly and don't rely on this feedback loop.
  useEffect(() => {
    const handlePopState = () => {
      const hashPhotoId = readPhotoIdFromHash(window.location.hash, photos);
      setCurrentPhotoId(hashPhotoId);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [photos]);

  /* --------------------------- Transitions ---------------------------- */
  // Each transition updates React state AND writes the hash. The
  // combination is one atomic user action per callback — no race
  // between the two writes, because both happen synchronously in the
  // same event handler.

  const open = useCallback(
    (photoId: LightboxPhoto["id"]) => {
      setCurrentPhotoId(photoId);
      // pushState so back-button-closes works. Preserve pathname and
      // search — only the hash changes.
      const url = `${window.location.pathname}${window.location.search}#${buildPhotoHashFragment(photoId)}`;
      window.history.pushState(null, "", url);
    },
    [],
  );

  const close = useCallback(() => {
    setCurrentPhotoId(null);
    // If our own pushState added the hash entry, back() pops it. If the
    // visitor deep-linked (arrived with the hash), there's no entry to
    // pop — back() would leave the page. Guard by inspecting the hash:
    // if it still matches our pattern, we're the ones who put it there
    // and can safely pop; otherwise clear via replaceState.
    if (window.location.hash.startsWith("#photo-")) {
      // Deep-link close: replace with a hash-free URL rather than
      // popping to a previous site. This costs the "back closes"
      // behaviour when arriving from an external link, but preserves
      // the visitor's ability to navigate back to wherever they came
      // from. Not ideal — flagging as a known trade-off.
      const url = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", url);
    }
  }, []);

  // Prev/next use the functional setter so they read the freshest state
  // without recreating the callback on every render.
  const goToPrevious = useCallback(() => {
    setCurrentPhotoId((existingPhotoId) => {
      if (existingPhotoId === null) {
        return existingPhotoId;
      }
      const existingIndex = photos.findIndex(
        (photo) => photo.id === existingPhotoId,
      );
      if (existingIndex <= 0) {
        return existingPhotoId;
      }
      const nextPhotoId = photos[existingIndex - 1].id;
      replacePhotoHash(nextPhotoId);
      return nextPhotoId;
    });
  }, [photos]);

  const goToNext = useCallback(() => {
    setCurrentPhotoId((existingPhotoId) => {
      if (existingPhotoId === null) {
        return existingPhotoId;
      }
      const existingIndex = photos.findIndex(
        (photo) => photo.id === existingPhotoId,
      );
      if (existingIndex < 0 || existingIndex >= photos.length - 1) {
        return existingPhotoId;
      }
      const nextPhotoId = photos[existingIndex + 1].id;
      replacePhotoHash(nextPhotoId);
      return nextPhotoId;
    });
  }, [photos]);

  return {
    currentPhotoId,
    currentPhoto,
    currentIndex,
    hasPrevious,
    hasNext,
    open,
    close,
    goToPrevious,
    goToNext,
  };
}

/* -------------------------------------------------------------------------- */
/* Hash helpers                                                               */
/* -------------------------------------------------------------------------- */

// One place that knows the hash format. If we ever change from
// `#photo-<id>` to something else, only these functions change.

const PHOTO_HASH_PREFIX = "photo-";

function buildPhotoHashFragment(photoId: LightboxPhoto["id"]): string {
  return `${PHOTO_HASH_PREFIX}${photoId}`;
}

function replacePhotoHash(photoId: LightboxPhoto["id"]): void {
  const url = `${window.location.pathname}${window.location.search}#${buildPhotoHashFragment(photoId)}`;
  window.history.replaceState(null, "", url);
}

/**
 * Parse `#photo-<id>` out of a location.hash string and match it against
 * the photos array. Returns null when:
 *   - the hash doesn't have the photo prefix
 *   - the parsed id doesn't match any photo in the array
 *
 * The parsed value is compared against the photos array so the state
 * only ever holds a valid photo id — never a bare "42" that doesn't
 * exist. Handles both numeric (D1 photo_id) and string ids.
 */
function readPhotoIdFromHash(
  rawHash: string,
  photos: readonly LightboxPhoto[],
): LightboxPhoto["id"] | null {
  // rawHash starts with "#" when present, or is empty string when not.
  if (!rawHash.startsWith(`#${PHOTO_HASH_PREFIX}`)) {
    return null;
  }
  const idFragment = rawHash.slice(`#${PHOTO_HASH_PREFIX}`.length);
  if (idFragment.length === 0) {
    return null;
  }

  // Try to match as-is first (covers string ids), then as a number.
  // Doing it in this order means a photo whose id happens to be the
  // string "42" would match before a photo whose id is the number 42;
  // this is fine because the current schema uses numbers exclusively.
  const stringMatch = photos.find((photo) => String(photo.id) === idFragment);
  if (stringMatch !== undefined) {
    return stringMatch.id;
  }
  return null;
}